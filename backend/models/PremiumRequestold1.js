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
      enum: ['pending', 'accepted', 'declined', 'completed'],
      default: 'pending',
    },

    // What the doctor sees before/at the start of chat — produced by the
    // premium pre-chat AI, not the full scored diagnostic.
    report: {
      mainConcern:        { type: String, default: '' },
      keyDetails:         { type: String, default: '' }, // freeform: patterns, triggers, duration mentioned
      urgency:             { type: String, enum: ['low', 'moderate', 'high'], default: 'moderate' },
      summary:             { type: String, default: '' }, // 2-3 sentence narrative for the doctor
    },

    conversationHistory: [{ role: String, content: String }], // full pre-chat transcript, for the doctor's reference
  },
  { timestamps: true }
);

premiumRequestSchema.methods.toClientJSON = function () {
  return {
    id:        this._id,
    status:    this.status,
    report:    this.report,
    createdAt: this.createdAt,
  };
};

// The doctor-facing shape includes the patient's name — never exposed to
// other patients, only to the doctor handling the request.
premiumRequestSchema.methods.toDoctorFacingJSON = function () {
  return {
    id:                   this._id,
    status:                this.status,
    report:                this.report,
    conversationHistory:   this.conversationHistory,
    createdAt:             this.createdAt,
  };
};

module.exports = mongoose.model('PremiumRequest', premiumRequestSchema);
