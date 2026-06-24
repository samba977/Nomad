const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  sendOtpToEmail,
  verifyOtp
} = require('../controllers/authController');

// 🔐 Auth routes
router.post('/signup', registerUser);
router.post('/login', loginUser);

// 📧 OTP routes
router.post('/send-otp', sendOtpToEmail);
router.post('/verify-otp', verifyOtp);

module.exports = router;
