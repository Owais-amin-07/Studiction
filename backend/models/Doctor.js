const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// Doctor accounts are NEVER created through the app — there is no signup
// route. They only exist by being inserted directly into the database
// (see scripts/seedDoctor.js), which is the whole point: "only when data
// aligns with a registered doctor record does the doctor page open."
const doctorSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },

    // Shown to patients at the start of a chat, so they know who they're
    // talking to before anything begins.
    specialization: { type: String, trim: true, default: '' },
    expertise:      { type: String, trim: true, default: '' }, // short freeform tags/areas, e.g. "Digital addiction, CBT"
    experience:      { type: String, trim: true, default: '' }, // e.g. "6 years"
    bio:             { type: String, trim: true, default: '' },
    profileComplete: { type: Boolean, default: false }, // true once specialization/expertise/experience are all filled in
  },
  { timestamps: true }
);

doctorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt    = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

doctorSchema.methods.comparePassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

doctorSchema.methods.toClientJSON = function () {
  return {
    id:              this._id,
    name:            this.name,
    email:           this.email,
    specialization:  this.specialization,
    expertise:       this.expertise,
    experience:      this.experience,
    bio:             this.bio,
    profileComplete: this.profileComplete,
  };
};

// The patient-facing version — only what a patient should see about the
// doctor they're paired with, nothing account-related.
doctorSchema.methods.toPatientFacingJSON = function () {
  return {
    name:           this.name,
    specialization: this.specialization,
    expertise:      this.expertise,
    experience:     this.experience,
    bio:            this.bio,
  };
};

module.exports = mongoose.model('Doctor', doctorSchema);
