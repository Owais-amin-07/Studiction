const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    tier:          { type: String, enum: ['low', 'moderate', 'high'], required: true },
    stage:         { type: String, enum: ['pre-contemplation','contemplation','preparation','action','maintenance'], required: true },
    score:         { type: Number, min: 0, max: 100, required: true },
    summary:       { type: String, required: true },
    addictionType: { type: String, enum: ['digital', 'nicotine', 'both'], default: 'digital' },
  },
  { timestamps: true }
);

resultSchema.methods.toClientJSON = function () {
  return {
    tier:          this.tier,
    stage:         this.stage,
    score:         this.score,
    summary:       this.summary,
    addictionType: this.addictionType,
  };
};

module.exports = mongoose.model('Result', resultSchema);