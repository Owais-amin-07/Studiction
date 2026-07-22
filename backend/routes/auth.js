const express = require('express');
const jwt     = require('jsonwebtoken');
const axios   = require('axios');
const User    = require('../models/User');
const protect = require('../middleware/auth');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email, and password are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing)
      return res.status(409).json({ error: 'An account with this email already exists' });
    const username = '@' + name.trim().split(' ')[0].toLowerCase();
    const user = await User.create({ name, email, password, username });
    res.status(201).json({ token: signToken(user._id), user: user.toClientJSON() });
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
      user = await User.create({ name: name || email.split('@')[0], email, googleId, username });
    } else if (!user.googleId) {
      // Existing email/password user — link their Google account
      user.googleId = googleId;
      await user.save();
    }

    res.json({ token: signToken(user._id), user: user.toClientJSON() });
  } catch (err) { next(err); }
});

module.exports = router;