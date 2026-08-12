const mongoose = require('mongoose');

// Records of the SIMULATED premium purchase flow — see routes/premium.js.
// No real payment gateway is involved (see project notes); this exists so
// that everything downstream of "payment" — activation, expiry, history —
// is real and testable, even though the processing step itself is mocked.
const paymentSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId:   { type: String, enum: ['monthly', 'yearly'], required: true },
    planName: { type: String, required: true },
    amount:   { type: Number, required: true },   // in PKR, whole rupees
    currency: { type: String, default: 'PKR' },
    status:   { type: String, enum: ['succeeded', 'failed'], required: true },
    simulatedTxnId: { type: String, required: true }, // looks like a real gateway reference, isn't one
  },
  { timestamps: true }
);

paymentSchema.methods.toClientJSON = function () {
  return {
    id:             this._id,
    planId:         this.planId,
    planName:       this.planName,
    amount:         this.amount,
    currency:       this.currency,
    status:         this.status,
    simulatedTxnId: this.simulatedTxnId,
    createdAt:      this.createdAt,
  };
};

module.exports = mongoose.model('Payment', paymentSchema);
