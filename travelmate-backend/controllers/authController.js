// /controllers/authController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerSchema, loginSchema } = require('../Validators/userValidators.js');
const { ZodError } = require('zod');
const sendMail = require('../utils/sendMail');
const { saveOtp, getOtp, deleteOtp } = require('../tempStorage/otpStore');

// ✅ Send OTP
const sendOtpToEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await sendMail(email, "Your OTP Verification Code", `Your OTP is: ${otp}`);
    saveOtp(email, otp);

    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

// ✅ Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const stored = getOtp(email);

    if (!stored || stored.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    deleteOtp(email);
    res.status(200).json({ message: "OTP verified" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
};

// ✅ Register User
const registerUser = async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    // OTP check
    const otpEntry = getOtp(data.email);
    if (!otpEntry || otpEntry.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }
    if (req.body.otp !== otpEntry.otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    deleteOtp(data.email);

    // Email check
    const userExists = await User.findOne({ email: data.email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // Citizenship format check (8–12 digits)
    if (!/^\d{8,12}$/.test(data.citizenshipId)) {
      return res.status(400).json({ message: 'Invalid Citizenship ID format' });
    }

    const idExists = await User.findOne({ citizenshipId: data.citizenshipId });
    if (idExists) return res.status(400).json({ message: 'Citizenship ID already in use' });

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = new User({ ...data, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Login User
const loginUser = async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ _id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      isAdmin: user.isAdmin,
      profileCreated: user.profileCreated || false,
      profileImageUrl: user.profileImageUrl || '',
      bio: user.bio || '',
      contactNo: user.contactNo || user.phone || '',
      interests: user.interests || []
    });

  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  sendOtpToEmail,
  verifyOtp
};
