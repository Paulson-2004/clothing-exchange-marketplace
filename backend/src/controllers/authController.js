const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Listing = require('../models/Listing');
const SwapRequest = require('../models/SwapRequest');
const generateToken = require('../utils/generateToken');

const COOKIE_NAME = 'token';

// Shared cookie options so login and register stay in sync, and logout
// can clear the cookie with matching options (browsers require the
// clearCookie options to match the ones used to set it).
// In production (Vercel <-> Render cross-domain), sameSite: 'none' and secure: true
// are required for the browser to include the httpOnly cookie with cross-origin requests.
const cookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true, // not accessible to JS -> protects against XSS token theft
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-origin production, 'lax' for local dev
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches JWT expiry
  };
};

// Strips sensitive/internal fields before sending a user back to the client.
const toSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || '',
  bio: user.bio || '',
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

// GET /api/auth/profile
// Relies on `protect` middleware loading req.user.
const getProfile = async (req, res, next) => {
  try {
    const user = req.user;

    // Fetch user's listings to check for swaps requested on their items
    const userListings = await Listing.find({ owner: user._id }).select('_id status');
    const userListingIds = userListings.map((l) => l._id);

    const [
      totalListings,
      availableListings,
      swappedListings,
      sentSwaps,
      incomingSwaps,
      completedSwaps,
    ] = await Promise.all([
      userListings.length,
      userListings.filter((l) => l.status === 'available').length,
      userListings.filter((l) => l.status === 'swapped').length,
      SwapRequest.countDocuments({ requester: user._id }),
      SwapRequest.countDocuments({ requestedListing: { $in: userListingIds } }),
      SwapRequest.countDocuments({
        $or: [{ requester: user._id }, { requestedListing: { $in: userListingIds } }],
        status: 'completed',
      }),
    ]);

    // Fetch up to 10 most recent swaps for the user's swap history
    const recentSwaps = await SwapRequest.find({
      $or: [{ requester: user._id }, { requestedListing: { $in: userListingIds } }],
    })
      .populate('requester', 'name email location')
      .populate({
        path: 'requestedListing',
        select: 'title images estimatedValue status owner',
        populate: { path: 'owner', select: 'name email location' },
      })
      .populate({
        path: 'offeredListing',
        select: 'title images estimatedValue status owner',
        populate: { path: 'owner', select: 'name email location' },
      })
      .sort({ updatedAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      user: toSafeUser(user),
      activity: {
        totalListings,
        availableListings,
        swappedListings,
        sentSwaps,
        incomingSwaps,
        completedSwaps,
      },
      recentSwaps,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/auth/profile
// Relies on `protect` middleware loading req.user.
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, bio, location } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        res.status(400);
        throw new Error('Name cannot be empty');
      }
      if (name.trim().length > 80) {
        res.status(400);
        throw new Error('Name cannot exceed 80 characters');
      }
      user.name = name.trim();
    }

    if (phone !== undefined) {
      user.phone = typeof phone === 'string' ? phone.trim() : '';
    }

    if (bio !== undefined) {
      if (typeof bio === 'string' && bio.trim().length > 300) {
        res.status(400);
        throw new Error('Bio cannot exceed 300 characters');
      }
      user.bio = typeof bio === 'string' ? bio.trim() : '';
    }

    if (location && typeof location === 'object') {
      user.location = {
        city: typeof location.city === 'string' ? location.city.trim() : (user.location?.city || ''),
        state: typeof location.state === 'string' ? location.state.trim() : (user.location?.state || ''),
        country: typeof location.country === 'string' ? location.country.trim() : (user.location?.country || ''),
      };
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: toSafeUser(updatedUser),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe, getProfile, updateProfile };
