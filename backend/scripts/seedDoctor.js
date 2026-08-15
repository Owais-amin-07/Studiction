// Creates (or updates) a doctor account directly in the database.
// This is intentionally the ONLY way a doctor account comes into existence —
// there is no in-app signup, by design.
//
// Usage:
//   node scripts/seedDoctor.js "Dr. Ayesha Khan" ayesha@studiction.com "somePassword123" "Addiction Psychiatry" "Digital & nicotine dependence, CBT" "6 years"
//
// Args: name  email  password  specialization  expertise  experience
require('dotenv').config();
const mongoose = require('mongoose');
const Doctor   = require('../models/Doctor');

async function main() {
  const [name, email, password, specialization = '', expertise = '', experience = ''] = process.argv.slice(2);

  if (!name || !email || !password) {
    console.error('Usage: node scripts/seedDoctor.js "Dr. Haris Amin" nima.en07@gmail.com haris@1234 ["Addiction Psychiatry"] ["Digital & nicotine dependence, CBT"] ["6 Years"]');
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set — check your backend/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const normalizedEmail = email.toLowerCase().trim();
  let doctor = await Doctor.findOne({ email: normalizedEmail });

  if (doctor) {
    doctor.name = name;
    doctor.password = password; // re-hashed by the pre-save hook since it's being set again
    if (specialization) doctor.specialization = specialization;
    if (expertise)      doctor.expertise      = expertise;
    if (experience)      doctor.experience     = experience;
    doctor.profileComplete = Boolean(doctor.specialization && doctor.expertise && doctor.experience);
    await doctor.save();
    console.log(`Updated existing doctor account: ${normalizedEmail}`);
  } else {
    doctor = new Doctor({
      name, email: normalizedEmail, password,
      specialization, expertise, experience,
      profileComplete: Boolean(specialization && expertise && experience),
    });
    await doctor.save();
    console.log(`Created doctor account: ${normalizedEmail}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});