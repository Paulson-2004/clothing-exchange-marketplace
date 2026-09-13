const express = require('express');
const { register, login, logout, getMe, getProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
// Logout is intentionally NOT behind `protect`: if a client's cookie is
// already invalid/expired, they should still be able to clear it rather
// than getting a 401 when all they want is to log out.
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
