const express       = require('express');
const jwt           = require('jsonwebtoken');
const Doctor        = require('../models/Doctor');
const protectDoctor = require('../middleware/doctorAuth');

const router = express.Router();

function signDoctorToken(doctorId) {
  return jwt.sign({ id: doctorId, role: 'doctor' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/doctor-auth/login
// Deliberately the ONLY way into a doctor session — there is no signup route
// here, and none should ever be added. Accounts exist only if an admin put
// them in the database (see scripts/seedDoctor.js).
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const doctor = await Doctor.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!doctor)
      return res.status(401).json({ error: 'No doctor account found with this email' });

    const isMatch = await doctor.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ error: 'Incorrect password' });

    res.json({ token: signDoctorToken(doctor._id), doctor: doctor.toClientJSON() });
  } catch (err) { next(err); }
});

// GET /api/doctor-auth/me
router.get('/me', protectDoctor, async (req, res) => {
  res.json({ doctor: req.doctor.toClientJSON() });
});

// PATCH /api/doctor-auth/profile
// Lets a logged-in doctor fill in the profile patients will see before chat.
router.patch('/profile', protectDoctor, async (req, res, next) => {
  try {
    const { specialization, expertise, experience, bio } = req.body;
    if (specialization !== undefined) req.doctor.specialization = specialization;
    if (expertise      !== undefined) req.doctor.expertise      = expertise;
    if (experience     !== undefined) req.doctor.experience     = experience;
    if (bio            !== undefined) req.doctor.bio            = bio;

    req.doctor.profileComplete = Boolean(
      req.doctor.specialization && req.doctor.expertise && req.doctor.experience
    );

    await req.doctor.save();
    res.json({ doctor: req.doctor.toClientJSON() });
  } catch (err) { next(err); }
});

module.exports = router;
