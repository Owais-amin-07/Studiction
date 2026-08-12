// Local development entry point. server.js only exports the Express app
// (that's what Vercel needs for serverless) — this file is what actually
// starts it listening on a port when you're running it on your own machine.
const app = require('./server');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀  Server running on http://localhost:${PORT}`);
});