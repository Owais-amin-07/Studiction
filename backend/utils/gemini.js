const axios = require('axios');

const GEMINI_MODEL = 'gemini-2.5-flash';

// Calls Gemini and returns a value shaped like the OpenAI response your
// existing code already expects — so nothing else has to change.
async function callGemini({ messages, max_tokens, temperature }) {
  const systemMsg = messages.find((m) => m.role === 'system');
  const turns = messages.filter((m) => m.role !== 'system');

  const body = {
    contents: turns.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    ...(systemMsg && { systemInstruction: { parts: [{ text: systemMsg.content }] } }),
    generationConfig: {
      maxOutputTokens: max_tokens || 800,
      temperature: temperature ?? 0.7,
    },
  };

  const { data } = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    body,
    { headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' } }
  );

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { choices: [{ message: { content: text } }] };
}

module.exports = { callGemini };