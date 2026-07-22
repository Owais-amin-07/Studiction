// backend/routes/diagnostic.js
const express = require('express');
const axios   = require('axios');
const protect = require('../middleware/auth');

const router = express.Router();
router.use(protect); // only logged-in users can trigger AI calls, matches /api/results pattern

// POST /api/diagnostic/chat — proxies Groq chat completions.
// The real API key lives only here, server-side, never sent to the browser.
router.post('/chat', async (req, res) => {
  try {
    const { data } = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      req.body, // { model, messages, max_tokens, temperature } — forwarded as-is
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
    );
    res.json(data);
  } catch (err) {
    console.error('Groq proxy error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: 'AI service error' });
  }
});

module.exports = router;