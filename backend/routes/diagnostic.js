const express = require('express');
const protect = require('../middleware/auth');
const { callGemini } = require('../utils/gemini');

const router = express.Router();
router.use(protect);

router.post('/chat', async (req, res) => {
  try {
    const data = await callGemini(req.body);
    res.json(data);
  } catch (err) {
    console.error('Gemini proxy error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: 'AI service error' });
  }
});

module.exports = router;