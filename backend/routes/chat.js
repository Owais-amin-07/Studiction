const express        = require('express');
const axios          = require('axios');
const PremiumRequest = require('../models/PremiumRequest');
const ChatMessage    = require('../models/ChatMessage');
const eitherAuth     = require('../middleware/eitherAuth');
const { triggerEvent } = require('../utils/pusher');

const router = express.Router();
router.use(eitherAuth); // every route here needs to know who's asking, patient or doctor

const SESSION_EXTEND_MS = 10 * 60 * 1000; // 10 minutes

// Confirms req.actor is actually a party to this specific request — a
// patient can only touch their own request, a doctor only one they accepted.
async function loadAuthorizedRequest(req, res) {
  const request = await PremiumRequest.findById(req.params.requestId).populate('patient', 'name');
  if (!request) { res.status(404).json({ error: 'Session not found' }); return null; }

  const isThisPatient = req.actor.type === 'patient' && request.patient._id.toString() === req.actor.id;
  const isThisDoctor  = req.actor.type === 'doctor'  && request.doctor?.toString() === req.actor.id;
  if (!isThisPatient && !isThisDoctor) {
    res.status(403).json({ error: 'You do not have access to this session' });
    return null;
  }
  if (request.status !== 'accepted' && request.status !== 'completed') {
    res.status(403).json({ error: 'This session has not been accepted yet' });
    return null;
  }
  return request;
}

// GET /api/chat/:requestId — room info + full message history
router.get('/:requestId', async (req, res, next) => {
  try {
    const request = await loadAuthorizedRequest(req, res);
    if (!request) return;

    const messages = await ChatMessage.find({ request: request._id }).sort({ createdAt: 1 });
    res.json({
      request: req.actor.type === 'doctor' ? request.toDoctorFacingJSON() : request.toClientJSON(),
      messages: messages.map((m) => m.toClientJSON()),
      sessionEnded: request.status === 'completed',
    });
  } catch (err) { next(err); }
});

// POST /api/chat/:requestId/messages
router.post('/:requestId/messages', async (req, res, next) => {
  try {
    const request = await loadAuthorizedRequest(req, res);
    if (!request) return;
    if (request.status === 'completed') return res.status(409).json({ error: 'This session has ended' });

    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

    const message = await ChatMessage.create({
      request:    request._id,
      senderType: req.actor.type,
      senderName: req.actor.name,
      content:    content.trim(),
    });

    const payload = message.toClientJSON();
    try {
      await triggerEvent(request._id.toString(), 'new-message', payload);
    } catch (pushErr) {
      // Pusher not configured yet, or a transient failure — the message is
      // still saved and will show up on next poll/refresh either way.
      console.error('Pusher trigger failed:', pushErr.message);
    }

    res.status(201).json({ message: payload });
  } catch (err) { next(err); }
});

// POST /api/chat/:requestId/extend — doctor only, +10 minutes
router.post('/:requestId/extend', async (req, res, next) => {
  try {
    if (req.actor.type !== 'doctor') return res.status(403).json({ error: 'Only the doctor can extend a session' });
    const request = await loadAuthorizedRequest(req, res);
    if (!request) return;
    if (request.status === 'completed') return res.status(409).json({ error: 'This session has already ended' });

    const base = request.sessionEndsAt && request.sessionEndsAt > new Date() ? request.sessionEndsAt : new Date();
    request.sessionEndsAt = new Date(base.getTime() + SESSION_EXTEND_MS);
    await request.save();

    const payload = { sessionEndsAt: request.sessionEndsAt };
    try { await triggerEvent(request._id.toString(), 'session-extended', payload); } catch { /* non-fatal */ }
    res.json(payload);
  } catch (err) { next(err); }
});

// POST /api/chat/:requestId/end — doctor only
router.post('/:requestId/end', async (req, res, next) => {
  try {
    if (req.actor.type !== 'doctor') return res.status(403).json({ error: 'Only the doctor can end a session' });
    const request = await loadAuthorizedRequest(req, res);
    if (!request) return;

    request.status = 'completed';
    await request.save();

    try { await triggerEvent(request._id.toString(), 'session-ended', {}); } catch { /* non-fatal */ }
    res.json({ status: 'completed' });
  } catch (err) { next(err); }
});

// POST /api/chat/:requestId/ai-tip — doctor only, private coaching suggestion
// based on the recent conversation. Never shown to the patient.
router.post('/:requestId/ai-tip', async (req, res, next) => {
  try {
    if (req.actor.type !== 'doctor') return res.status(403).json({ error: 'Only the doctor can request a tip' });
    const request = await loadAuthorizedRequest(req, res);
    if (!request) return;

    const recentMessages = await ChatMessage.find({ request: request._id }).sort({ createdAt: -1 }).limit(12);
    const transcript = recentMessages.reverse()
      .map((m) => `${m.senderType === 'patient' ? 'Patient' : 'Doctor'}: ${m.content}`)
      .join('\n');

    const { data } = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a private coaching assistant for a doctor currently in a live chat with a patient recovering from digital or nicotine addiction. The patient never sees this. Given the recent transcript, give ONE short, actionable tip — an angle worth exploring, a warning sign to watch for, or a way to phrase something with more empathy. 1-2 sentences, plain text, no JSON, no preamble.`,
          },
          { role: 'user', content: transcript || 'The conversation has just started — no messages yet.' },
        ],
        max_tokens: 120,
        temperature: 0.6,
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
    );

    const tip = data.choices?.[0]?.message?.content?.trim() || 'No tip available right now.';
    res.json({ tip });
  } catch (err) {
    console.error('AI tip error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Could not generate a tip right now' });
  }
});

// POST /api/chat/:requestId/recommendation/draft — doctor only.
// Drafts a Recommendation/Care Plan from the session transcript. This is
// deliberately NOT a prescription — no medication names or dosages, ever.
// Returns a draft for the doctor to review/edit; nothing is saved yet.
router.post('/:requestId/recommendation/draft', async (req, res, next) => {
  try {
    if (req.actor.type !== 'doctor') return res.status(403).json({ error: 'Only the doctor can draft a recommendation' });
    const request = await loadAuthorizedRequest(req, res);
    if (!request) return;

    const messages = await ChatMessage.find({ request: request._id }).sort({ createdAt: 1 });
    const transcript = messages
      .map((m) => `${m.senderType === 'patient' ? 'Patient' : 'Doctor'}: ${m.content}`)
      .join('\n') || '(no messages were exchanged this session)';

    const { data } = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are helping a doctor draft a short Recommendation / Care Plan for a patient after a live chat session about digital or nicotine addiction recovery. This is NOT a medical prescription — never mention medication names, dosages, or any pharmaceutical content. Write 3-5 sentences: acknowledge their situation specifically (referencing something from the transcript), suggest concrete behavioral next steps, and end with encouragement. Warm, professional, plain text — no headers, no markdown, no lists.`,
          },
          { role: 'user', content: `Pre-chat summary: ${request.report?.summary || 'N/A'}\n\nSession transcript:\n${transcript}` },
        ],
        max_tokens: 300,
        temperature: 0.6,
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
    );

    const draft = data.choices?.[0]?.message?.content?.trim() || '';
    res.json({ draft });
  } catch (err) {
    console.error('Recommendation draft error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Could not generate a draft right now' });
  }
});

// POST /api/chat/:requestId/recommendation — doctor only. Saves the final
// (possibly hand-edited) text and marks it sent — this is the moment it
// actually becomes visible on the patient's dashboard.
router.post('/:requestId/recommendation', async (req, res, next) => {
  try {
    if (req.actor.type !== 'doctor') return res.status(403).json({ error: 'Only the doctor can send a recommendation' });
    const request = await loadAuthorizedRequest(req, res);
    if (!request) return;

    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Recommendation cannot be empty' });

    request.recommendation = { content: content.trim(), sentAt: new Date() };
    await request.save();

    res.json({ recommendation: request.recommendation });
  } catch (err) { next(err); }
});

module.exports = router;
