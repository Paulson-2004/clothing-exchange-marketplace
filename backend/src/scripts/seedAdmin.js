// Creates (or updates) a single admin account from environment
// variables. Never run automatically - only via `npm run seed:admin`.
// Safe to run more than once: if the admin already exists, it will
// just confirm rather than creating a duplicate.

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

const seedAdmin = async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env before seeding.');
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 6) {
    console.error('ADMIN_PASSWORD must be at least 6 characters.');
    process.exit(1);
  }

  await connectDB();

  const normalizedEmail = ADMIN_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`Existing user ${normalizedEmail} promoted to admin.`);
    } else {
      console.log(`Admin account ${normalizedEmail} already exists. Nothing to do.`);
    }
    await mongoose.disconnect();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

  await User.create({
    name: 'Admin',
    email: normalizedEmail,
    passwordHash,
    role: 'admin',
  });

  console.log(`Admin account created: ${normalizedEmail}`);
  await mongoose.disconnect();
};

seedAdmin().catch((err) => {
  console.error('Failed to seed admin:', err.message);
  process.exit(1);
});
