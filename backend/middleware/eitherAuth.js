const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const Doctor = require('../models/Doctor');

// The live chat is the one place patient and doctor tokens legitimately
// need to hit the same routes. This checks the JWT's role claim and looks
// the account up in the matching collection, then normalizes the result
// into req.actor so route handlers don't need to care which kind it was.
module.exports = async function eitherAuth(req, res, next) {
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

    if (decoded.role === 'doctor') {
      const doctor = await Doctor.findById(decoded.id);
      if (!doctor) return res.status(401).json({ error: 'Doctor account no longer exists' });
      req.actor = { type: 'doctor', id: doctor._id.toString(), name: doctor.name, doc: doctor };
    } else {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return res.status(401).json({ error: 'User no longer exists' });
      req.actor = { type: 'patient', id: user._id.toString(), name: user.name, doc: user };
    }
    next();
  } catch (err) {
    next(err);
  }
};
