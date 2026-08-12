const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    googleId: { type: String, sparse: true },
    username:   { type: String, trim: true },
    goal:       { type: String, trim: true, default: '' },
    joinedDate: {
      type:    String,
      default: () => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    },

    // ── Email OTP verification ──────────────────────────────────────────
    isVerified:     { type: Boolean, default: false },
    otpHash:        { type: String, select: false },
    otpExpiresAt:   { type: Date,   select: false },
    otpAttempts:    { type: Number, default: 0, select: false }, // wrong-code tries against the current OTP
    otpResendCount: { type: Number, default: 0, select: false }, // resends used for this signup
    lastOtpSentAt:  { type: Date,   select: false },

    // ── Premium membership ────────────────────────────────────────────────
    // Simulated payment layer — see routes/premium.js. isPremium is always
    // derived from premiumExpiresAt at read time via hasActivePremium(),
    // never trusted as a standalone flag, so an expired plan can't linger
    // as "active" just because nothing happened to flip a boolean.
    premiumPlan:      { type: String, enum: ['monthly', 'yearly', null], default: null },
    premiumExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt    = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

const OTP_TTL_MS             = 5  * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;       // 60 seconds
const OTP_MAX_ATTEMPTS       = 5;
const OTP_MAX_RESENDS        = 5;

// Generates a fresh 6-digit code, stores its hash + a 5-minute expiry on the
// user, and resets the per-code attempt counter. Returns the PLAINTEXT code
// so the caller can email it — it is never itself persisted.
// Pass isResend: true from the resend route so the resend budget is tracked
// here in one place, rather than every caller having to remember to bump it.
userSchema.methods.issueOtp = async function ({ isResend = false } = {}) {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits, no leading-zero edge case
  const salt = await bcrypt.genSalt(10);
  this.otpHash       = await bcrypt.hash(code, salt);
  this.otpExpiresAt  = new Date(Date.now() + OTP_TTL_MS);
  this.otpAttempts   = 0;
  this.lastOtpSentAt = new Date();
  if (isResend) this.otpResendCount = (this.otpResendCount || 0) + 1;
  await this.save();
  return code;
};

// Checks resend cooldown/cap BEFORE issuing a new code. Throws a
// { status, error } shaped object the route can forward directly.
userSchema.methods.canResendOtp = function () {
  if (this.otpResendCount >= OTP_MAX_RESENDS) {
    return { ok: false, status: 429, error: 'Maximum resend attempts reached. Please restart signup.' };
  }
  if (this.lastOtpSentAt && Date.now() - this.lastOtpSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - this.lastOtpSentAt.getTime())) / 1000);
    return { ok: false, status: 429, error: `Please wait ${wait}s before requesting another code.` };
  }
  return { ok: true };
};

// Verifies a submitted code against the stored hash/expiry/attempt budget.
// On success: marks the account verified and clears all OTP fields.
// On failure: increments the attempt counter and reports remaining tries.
userSchema.methods.verifyOtp = async function (submitted) {
  if (!this.otpHash || !this.otpExpiresAt) {
    return { ok: false, status: 400, error: 'No verification code is pending. Please request a new one.' };
  }
  if (this.otpExpiresAt.getTime() < Date.now()) {
    return { ok: false, status: 400, error: 'This code has expired. Please request a new one.' };
  }
  if (this.otpAttempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, status: 429, error: 'Too many incorrect attempts. Please request a new code.' };
  }

  const match = await bcrypt.compare(submitted, this.otpHash);
  if (!match) {
    this.otpAttempts += 1;
    await this.save();
    const remaining = OTP_MAX_ATTEMPTS - this.otpAttempts;
    return { ok: false, status: 400, error: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` };
  }

  this.isVerified     = true;
  this.otpHash        = undefined;
  this.otpExpiresAt   = undefined;
  this.otpAttempts    = 0;
  this.otpResendCount = 0;
  this.lastOtpSentAt  = undefined;
  await this.save();
  return { ok: true };
};

userSchema.methods.hasActivePremium = function () {
  return Boolean(this.premiumExpiresAt && this.premiumExpiresAt.getTime() > Date.now());
};

userSchema.methods.toClientJSON = function () {
  return {
    name:             this.name,
    email:            this.email,
    username:         this.username,
    joinedDate:       this.joinedDate,
    goal:             this.goal,
    isPremium:        this.hasActivePremium(),
    premiumPlan:      this.hasActivePremium() ? this.premiumPlan : null,
    premiumExpiresAt: this.hasActivePremium() ? this.premiumExpiresAt : null,
  };
};

module.exports = mongoose.model('User', userSchema);