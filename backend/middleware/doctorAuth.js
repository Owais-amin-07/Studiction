const jwt    = require('jsonwebtoken');
const Doctor = require('../models/Doctor');

module.exports = async function protectDoctor(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated — token missing' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token — please log in again' });
    }
    // A patient's token is structurally valid JWT too — the role claim is
    // what actually keeps the two portals separate.
    if (decoded.role !== 'doctor') {
      return res.status(403).json({ error: 'This isn\'t a doctor account' });
    }
    const doctor = await Doctor.findById(decoded.id);
    if (!doctor) return res.status(401).json({ error: 'Doctor account no longer exists' });
    req.doctor = doctor;
    next();
  } catch (err) {
    next(err);
  }
};
