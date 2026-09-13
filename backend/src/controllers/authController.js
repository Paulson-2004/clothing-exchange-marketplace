const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const COOKIE_NAME = 'token';

// Shared cookie options so login and register stay in sync, and logout
// can clear the cookie with matching options (browsers require the
// clearCookie options to match the ones used to set it).
const cookieOptions = () => ({
  httpOnly: true, // not accessible to JS -> protects against XSS token theft
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'lax', // sent on top-level navigation & same-site requests
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches JWT expiry
});

// Strips sensitive/internal fields before sending a user back to the client.
const toSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  location: user.location,
  createdAt: user.createdAt,
});

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, location } = req.body;

    // --- Backend validation (do not trust the frontend) ---
    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Name, email, and password are required');
    }
    if (password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      res.status(400);
      throw new Error('Please provide a valid email address');
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409);
      throw new Error('An account with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // role is intentionally never taken from req.body — it always
    // defaults to 'user'. Admin accounts are only created via seedAdmin.js.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      location: {
        city: location?.city?.trim() || '',
        state: location?.state?.trim() || '',
        country: location?.country?.trim() || '',
      },
    });

    const token = generateToken(user._id, user.role);
    res.cookie(COOKIE_NAME, token, cookieOptions());

    res.status(201).json({ success: true, user: toSafeUser(user) });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Email and password are required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // passwordHash has select: false on the schema, so it must be
    // explicitly requested here to compare it.
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    // Use the same generic error for "no such user" and "wrong password"
    // so we don't reveal which emails are registered.
    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const token = generateToken(user._id, user.role);
    res.cookie(COOKIE_NAME, token, cookieOptions());

    res.status(200).json({ success: true, user: toSafeUser(user) });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// GET /api/auth/me
// Relies on the `protect` middleware having already loaded req.user.
const getMe = async (req, res) => {
  res.status(200).json({ success: true, user: toSafeUser(req.user) });
};

module.exports = { register, login, logout, getMe };
