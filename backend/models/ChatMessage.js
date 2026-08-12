const mongoose = require('mongoose');

// One message in a live premium chat. The PremiumRequest _id IS the room —
// no separate "session" concept needed since an accepted request already
// uniquely pairs one patient with one doctor.
const chatMessageSchema = new mongoose.Schema(
  {
    request:    { type: mongoose.Schema.Types.ObjectId, ref: 'PremiumRequest', required: true, index: true },
    senderType: { type: String, enum: ['patient', 'doctor'], required: true },
    senderName: { type: String, required: true },
    content:    { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

chatMessageSchema.methods.toClientJSON = function () {
  return {
    id:         this._id,
    senderType: this.senderType,
    senderName: this.senderName,
    content:    this.content,
    createdAt:  this.createdAt,
  };
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
