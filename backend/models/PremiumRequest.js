const mongoose = require('mongoose');

// Created once a premium patient finishes their short AI pre-chat. Sits
// 'pending' until a doctor accepts it (Phase 4 builds the doctor-side view
// of this) — this phase is responsible for creating it correctly with a
// real, useful summary attached.
const premiumRequestSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctor:  { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null }, // set once accepted

    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed', 'expired'],
      default: 'pending',
    },

    // Set once accepted: a fixed 20-minute window, extendable by the doctor
    // in +10-minute increments (see routes/chat.js).
    sessionEndsAt: { type: Date, default: null },

    // What the doctor sees before/at the start of chat — produced by the
    // premium pre-chat AI, not the full scored diagnostic.
    report: {
      mainConcern:        { type: String, default: '' },
      keyDetails:         { type: String, default: '' }, // freeform: patterns, triggers, duration mentioned
      urgency:             { type: String, enum: ['low', 'moderate', 'high'], default: 'moderate' },
      summary:             { type: String, default: '' }, // 2-3 sentence narrative for the doctor
    },

    conversationHistory: [{ role: String, content: String }], // full pre-chat transcript, for the doctor's reference

    // The doctor's post-session write-up. Deliberately called a
    // Recommendation / Care Plan, never a prescription — no medication
    // names or dosages are ever generated here (see the AI prompt in
    // routes/chat.js). This is what actually lands on the patient's
    // dashboard once the doctor sends it.
    recommendation: {
      content:   { type: String, default: '' },
      sentAt:    { type: Date, default: null },
    },
  },
  { timestamps: true }
);

premiumRequestSchema.methods.toClientJSON = function () {
  // Patient-facing — includes the doctor's public profile once assigned,
  // since the patient needs to see who they're about to talk to.
  return {
    id:            this._id,
    status:        this.status,
    report:        this.report,
    sessionEndsAt: this.sessionEndsAt,
    doctor:        this.doctor && this.doctor.toPatientFacingJSON ? this.doctor.toPatientFacingJSON() : null,
    recommendation: this.recommendation?.sentAt ? this.recommendation : null, // hidden from the patient until actually sent
    createdAt:     this.createdAt,
  };
};

// The doctor-facing shape includes the patient's name — never exposed to
// other patients, only to the doctor handling the request.
premiumRequestSchema.methods.toDoctorFacingJSON = function () {
  return {
    id:                   this._id,
    patientName:           this.patient?.name || 'A member',
    status:                this.status,
    report:                this.report,
    sessionEndsAt:         this.sessionEndsAt,
    conversationHistory:   this.conversationHistory,
    recommendation:        this.recommendation,
    createdAt:             this.createdAt,
  };
};

module.exports = mongoose.model('PremiumRequest', premiumRequestSchema);
