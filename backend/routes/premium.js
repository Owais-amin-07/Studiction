const express = require('express');
const crypto  = require('crypto');
const User    = require('../models/User');
const Payment = require('../models/Payment');
const protect = require('../middleware/auth');

const router = express.Router();

// Fixed catalog — deliberately not a DB collection. Two plans is a small,
// stable list; hardcoding it avoids a pointless extra round trip for
// something that basically never changes at runtime.
const PLANS = {
  monthly: { id: 'monthly', name: 'Monthly',       amount: 999,  currency: 'PKR', days: 30 },
  yearly:  { id: 'yearly',  name: 'Yearly',         amount: 8999, currency: 'PKR', days: 365 },
};

function fakeTxnId() {
  return 'SIM-' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

// GET /api/premium/plans — public, just a catalog listing
router.get('/plans', (_req, res) => {
  res.json({ plans: Object.values(PLANS) });
});

// POST /api/premium/purchase
// Simulates gateway processing (no real money moves — see Payment model
// comment). Succeeds by default. simulateFailure is an explicit, deliberate
// flag the frontend can send from a "test a failed payment" control, so the
// failure path is demoable without ever being unpredictable during a real
// demo — never a random chance of failing on its own.
router.post('/purchase', protect, async (req, res, next) => {
  try {
    const { planId, simulateFailure } = req.body;
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: 'Unknown plan selected' });

    const status = simulateFailure ? 'failed' : 'succeeded';
    const payment = await Payment.create({
      user:           req.user._id,
      planId:         plan.id,
      planName:       plan.name,
      amount:         plan.amount,
      currency:       plan.currency,
      status,
      simulatedTxnId: fakeTxnId(),
    });

    if (status === 'failed') {
      return res.status(402).json({
        error:   'Payment could not be processed. Please try again.',
        payment: payment.toClientJSON(),
      });
    }

    // Activate/extend: if they already have active premium, extend from its
    // current expiry rather than from now, so back-to-back purchases stack
    // instead of wasting time already paid for.
    const user = req.user;
    const base = user.hasActivePremium() && user.premiumExpiresAt > new Date()
      ? user.premiumExpiresAt
      : new Date();
    user.premiumPlan      = plan.id;
    user.premiumExpiresAt = new Date(base.getTime() + plan.days * 24 * 60 * 60 * 1000);
    await user.save();

    res.status(201).json({ payment: payment.toClientJSON(), user: user.toClientJSON() });
  } catch (err) { next(err); }
});

// GET /api/premium/history
router.get('/history', protect, async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ payments: payments.map((p) => p.toClientJSON()) });
  } catch (err) { next(err); }
});

module.exports = router;
