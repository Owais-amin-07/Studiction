const express = require('express');
const jwt     = require('jsonwebtoken');
const axios   = require('axios');
const User    = require('../models/User');
const protect = require('../middleware/auth');
const { sendOtpEmail } = require('../utils/mailer');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

// POST /api/auth/signup
// Creates the account in an UNVERIFIED state and emails a 6-digit OTP.
// No token is issued here — that only happens after /verify-otp succeeds.
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email, and password are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });

    let user;
    if (existing && existing.isVerified) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    } else if (existing) {
      // Previously started but never verified — let them restart cleanly
      // rather than getting stuck behind a dead signup attempt.
      existing.name     = name;
      existing.password = password;
      existing.username = '@' + name.trim().split(' ')[0].toLowerCase();
      user = existing;
    } else {
      const username = '@' + name.trim().split(' ')[0].toLowerCase();
      user = new User({ name, email: normalizedEmail, password, username });
    }

    await user.save(); // ensures the account (and its _id) exists before we email a code tied to it
    const code = await user.issueOtp();
    await sendOtpEmail(user.email, code);

    res.status(201).json({ message: 'Verification code sent to your email', email: user.email });
  } catch (err) { next(err); }
});

// POST /api/auth/verify-otp
// The moment verification actually succeeds: marks the account verified,
// clears the OTP, and — only now — issues the login token.
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ error: 'Email and code are required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+otpHash +otpExpiresAt +otpAttempts +otpResendCount +lastOtpSentAt');
    if (!user)
      return res.status(404).json({ error: 'No pending signup found for this email' });
    if (user.isVerified)
      return res.status(400).json({ error: 'This account is already verified' });

    const result = await user.verifyOtp(otp);
    if (!result.ok)
      return res.status(result.status).json({ error: result.error });

    res.json({ token: signToken(user._id), user: user.toClientJSON() });
  } catch (err) { next(err); }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+otpHash +otpExpiresAt +otpAttempts +otpResendCount +lastOtpSentAt');
    if (!user)
      return res.status(404).json({ error: 'No pending signup found for this email' });
    if (user.isVerified)
      return res.status(400).json({ error: 'This account is already verified' });

    const check = user.canResendOtp();
    if (!check.ok)
      return res.status(check.status).json({ error: check.error });

    const code = await user.issueOtp({ isResend: true });
    await sendOtpEmail(user.email, code);

    res.json({ message: 'A new code has been sent' });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user)
      return res.status(401).json({ error: 'No account found with this email' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ error: 'Incorrect password' });
    if (!user.isVerified)
      return res.status(403).json({ error: 'Please verify your email before logging in', email: user.email });
    res.json({ token: signToken(user._id), user: user.toClientJSON() });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user.toClientJSON() });
});

// PATCH /api/auth/me
// PATCH /api/auth/me
router.patch('/me', protect, async (req, res, next) => {
  try {
    const { name, username, goal } = req.body;
    const updates = {};
    if (name)     updates.name     = name.trim();
    if (username) updates.username = username.trim();
    if (goal !== undefined) updates.goal = goal.trim();
    if (!Object.keys(updates).length)
      return res.status(400).json({ error: 'No valid fields to update' });
    const updated = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ user: updated.toClientJSON() });
  } catch (err) { next(err); }
});

// POST /api/auth/google
router.post('/google', async (req, res, next) => {
  try {
    const { access_token } = req.body;
    if (!access_token)
      return res.status(400).json({ error: 'Google access token required' });

    // Verify with Google + fetch profile
    let profile;
    try {
      const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      profile = data;
    } catch (err) {
      return res.status(401).json({ error: 'Google token invalid or expired' });
    }

    const { sub: googleId, email, name } = profile;

    // Find by googleId OR email (handles account linking)
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // New user — create without password
      const username = '@' + (name || email).trim().split(' ')[0].toLowerCase();
      user = await User.create({ name: name || email.split('@')[0], email, googleId, username, isVerified: true });
    } else if (!user.googleId || !user.isVerified) {
      // Existing email/password user — link their Google account, and if
      // they'd never finished OTP verification, Google confirming the same
      // email address is just as good as one, so mark them verified.
      user.googleId   = googleId;
      user.isVerified = true;
      await user.save();
    }

    res.json({ token: signToken(user._id), user: user.toClientJSON() });
  } catch (err) { next(err); }
});

module.exports = router;