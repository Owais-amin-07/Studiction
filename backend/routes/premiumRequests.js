const express        = require('express');
const PremiumRequest = require('../models/PremiumRequest');
const Doctor         = require('../models/Doctor');
const protect        = require('../middleware/auth');
const protectDoctor   = require('../middleware/doctorAuth');
const { sendDoctorRequestAlert, sendRequestAcceptedEmail } = require('../utils/mailer');

const router = express.Router();

const EXPIRY_MS   = 12 * 60 * 60 * 1000; // pending requests expire after 12 hours
const COOLDOWN_MS = 12 * 60 * 60 * 1000; // one request per patient per 12 hours

// Lazily mark old pending requests as expired — no cron needed.
async function expireOldRequests() {
  const cutoff = new Date(Date.now() - EXPIRY_MS);
  const stale = await PremiumRequest.find({ status: 'pending', createdAt: { $lt: cutoff } });
  for (const r of stale) {
    r.status = 'expired';
    await r.save();
  }
}

// POST /api/premium-requests
router.post('/', protect, async (req, res, next) => {
  try {
    const { report, conversationHistory } = req.body;
    if (!report || !report.summary) {
      return res.status(400).json({ error: 'A report with a summary is required' });
    }
    if (!req.user.hasActivePremium()) {
      return res.status(403).json({ error: 'An active Premium membership is required for this' });
    }

    // One request per patient inside the cooldown window
    const cutoff = new Date(Date.now() - COOLDOWN_MS);
    const recent = await PremiumRequest.findOne({ patient: req.user._id, createdAt: { $gte: cutoff } });
    if (recent) {
      return res.status(429).json({ error: 'You already have a recent request. Please wait before sending another.' });
    }

    const request = await PremiumRequest.create({
      patient: req.user._id,
      report: {
        mainConcern: report.mainConcern || '',
        keyDetails:  report.keyDetails  || '',
        urgency:     report.urgency     || 'moderate',
        summary:     report.summary,
      },
      conversationHistory: conversationHistory || [],
    });

    // 🔔 Notify all doctors by email (fire-and-forget)
    const patientName = req.user.name || 'Patient';
    const siteUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    Doctor.find({}).then((doctors) => {
      doctors.forEach((doc) => {
        sendDoctorRequestAlert(doc, patientName, siteUrl)
          .catch((err) => console.error(`Doctor alert failed for ${doc.email}:`, err.message));
      });
    }).catch((err) => console.error('Failed to fetch doctors for alerts:', err.message));

    res.status(201).json({ request: request.toClientJSON() });
  } catch (err) { next(err); }
});

// GET /api/premium-requests/mine
router.get('/mine', protect, async (req, res, next) => {
  try {
    await expireOldRequests();
    const request = await PremiumRequest.findOne({ patient: req.user._id }).sort({ createdAt: -1 }).populate('doctor');
    res.json({ request: request ? request.toClientJSON() : null });
  } catch (err) { next(err); }
});

// GET /api/premium-requests/pending
router.get('/pending', protectDoctor, async (req, res, next) => {
  try {
    await expireOldRequests();
    const requests = await PremiumRequest.find({ status: 'pending' })
      .populate('patient', 'name')
      .sort({ createdAt: 1 });
    res.json({ requests: requests.map((r) => r.toDoctorFacingJSON()) });
  } catch (err) { next(err); }
});

// PATCH /api/premium-requests/:id/accept
router.patch('/:id/accept', protectDoctor, async (req, res, next) => {
  try {
    const request = await PremiumRequest.findById(req.params.id).populate('patient', 'name email');
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(409).json({ error: 'This request has already been handled' });
    }
    request.status = 'accepted';
    request.doctor = req.doctor._id;
    request.sessionEndsAt = new Date(Date.now() + 20 * 60 * 1000);
    await request.save();

    // Email the patient with a direct link into the chat
    const chatUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/#chat=${request._id}`;
    sendRequestAcceptedEmail(request.patient.email, request.patient.name, req.doctor.name, chatUrl)
      .catch((err) => console.error('Accepted alert failed:', err.message));

    res.json({ request: request.toDoctorFacingJSON() });
  } catch (err) { next(err); }
});

module.exports = router;