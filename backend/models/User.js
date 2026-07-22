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

userSchema.methods.toClientJSON = function () {
  return {
    name:       this.name,
    email:      this.email,
    username:   this.username,
    joinedDate: this.joinedDate,
    goal:       this.goal,
  };
};

module.exports = mongoose.model('User', userSchema);