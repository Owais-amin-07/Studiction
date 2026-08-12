require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

const authRoutes       = require('./routes/auth');
const doctorAuthRoutes = require('./routes/doctorAuth');
const resultsRoutes    = require('./routes/results');
const diagnosticRoutes = require('./routes/diagnostic');
const premiumRoutes    = require('./routes/premium');

const app = express();

app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ── MongoDB connection, cached across serverless invocations ───────────────
let dbConnectionPromise = null;
function connectDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!dbConnectionPromise) {
    dbConnectionPromise = mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log('✅  MongoDB connected'))
      .catch((err) => {
        dbConnectionPromise = null; // allow retry on next request if it failed
        throw err;
      });
  }
  return dbConnectionPromise;
}

// Every request first ensures a DB connection exists (cheap no-op once warm).
app.use(async (_req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.use('/api/auth',        authRoutes);
app.use('/api/doctor-auth', doctorAuthRoutes);
app.use('/api/results',     resultsRoutes);
app.use('/api/diagnostic',  diagnosticRoutes);
app.use('/api/premium',     premiumRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// No app.listen() here on purpose — see local.js for local dev,
// and api/index.js for how Vercel runs this in production.
module.exports = app;

























// require('dotenv').config();
// const express  = require('express');
// const cors     = require('cors');
// const mongoose = require('mongoose');

// const authRoutes       = require('./routes/auth');
// const resultsRoutes    = require('./routes/results');
// const diagnosticRoutes = require('./routes/diagnostic');


// const app = express();

// app.use(cors({
//   origin:      process.env.CLIENT_ORIGIN || 'http://localhost:5173',
//   credentials: true,
// }));
// app.use(express.json());

// app.use('/api/auth',       authRoutes);
// app.use('/api/results',    resultsRoutes);
// app.use('/api/diagnostic', diagnosticRoutes);

// app.get('/api/health', (_req, res) => {
//   res.json({ status: 'ok', timestamp: new Date().toISOString() });
// });

// app.use((err, _req, res, _next) => {
//   console.error('[ERROR]', err.message);
//   res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
// });

// const PORT = process.env.PORT || 5000;

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log('✅  MongoDB connected');
//     app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));
//   })
//   .catch((err) => {
//     console.error('❌  MongoDB connection failed:', err.message);
//     process.exit(1);
//   });
