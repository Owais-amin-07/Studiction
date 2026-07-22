const express = require('express');
const Result  = require('../models/Result');
const protect = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// POST /api/results  — saves or overwrites result
router.post('/', async (req, res, next) => {
  try {
    const { tier, stage, score, summary, addictionType } = req.body;
    if (!tier || !stage || score === undefined || !summary)
      return res.status(400).json({ error: 'tier, stage, score, and summary are required' });
    const result = await Result.findOneAndUpdate(
      { user: req.user._id },
      { tier, stage, score, summary, addictionType: addictionType || 'digital' },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ result: result.toClientJSON() });
  } catch (err) { next(err); }
});

// GET /api/results/me
router.get('/me', async (req, res, next) => {
  try {
    const result = await Result.findOne({ user: req.user._id });
    res.json({ result: result ? result.toClientJSON() : null });
  } catch (err) { next(err); }
});

module.exports = router;