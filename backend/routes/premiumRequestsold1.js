const express        = require('express');
const PremiumRequest = require('../models/PremiumRequest');
const protect        = require('../middleware/auth');
const protectDoctor   = require('../middleware/doctorAuth');

const router = express.Router();

// POST /api/premium-requests
// Patient submits their finished premium pre-chat as a request for a doctor.
router.post('/', protect, async (req, res, next) => {
  try {
    const { report, conversationHistory } = req.body;
    if (!report || !report.summary) {
      return res.status(400).json({ error: 'A report with a summary is required' });
    }
    if (!req.user.hasActivePremium()) {
      return res.status(403).json({ error: 'An active Premium membership is required for this' });
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

    res.status(201).json({ request: request.toClientJSON() });
  } catch (err) { next(err); }
});

// GET /api/premium-requests/mine — a patient checking their own latest request's status
router.get('/mine', protect, async (req, res, next) => {
  try {
    const request = await PremiumRequest.findOne({ patient: req.user._id }).sort({ createdAt: -1 });
    res.json({ request: request ? request.toClientJSON() : null });
  } catch (err) { next(err); }
});

// GET /api/premium-requests/pending — doctor's incoming queue
router.get('/pending', protectDoctor, async (req, res, next) => {
  try {
    const requests = await PremiumRequest.find({ status: 'pending' })
      .populate('patient', 'name')
      .sort({ createdAt: 1 }); // oldest first — first come, first served
    res.json({ requests: requests.map((r) => r.toDoctorFacingJSON()) });
  } catch (err) { next(err); }
});

// PATCH /api/premium-requests/:id/accept
router.patch('/:id/accept', protectDoctor, async (req, res, next) => {
  try {
    const request = await PremiumRequest.findById(req.params.id).populate('patient', 'name');
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(409).json({ error: 'This request has already been handled' });
    }
    request.status = 'accepted';
    request.doctor = req.doctor._id;
    await request.save();
    res.json({ request: request.toDoctorFacingJSON() });
  } catch (err) { next(err); }
});

module.exports = router;
