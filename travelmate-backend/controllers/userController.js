const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { profileSchema } = require('../Validators/userValidators.js');
const { ZodError } = require('zod');

// ✅ Create Profile
const createProfile = async (req, res) => {
  try {
    const body = { ...req.body, userId: req.body.userId };
    const data = profileSchema.parse(body);
    const profileImageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);

    let parsedInterests = [];
    try {
      parsedInterests = typeof req.body.interests === 'string'
        ? JSON.parse(req.body.interests)
        : (Array.isArray(req.body.interests) ? req.body.interests : []);
    } catch {
      parsedInterests = [];
    }

    const location = lat && lng
      ? { type: "Point", coordinates: [lng, lat] }
      : undefined;

    const updateData = {
      bio: data.bio,
      contactNo: data.contactNo,
      profileImageUrl,
      profileCreated: true,
      interests: parsedInterests
    };

    if (location) updateData.location = location;

    const updatedUser = await User.findByIdAndUpdate(
      data.userId,
      updateData,
      { new: true }
    );

    res.json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      contactNo: updatedUser.contactNo,
      profileCreated: true,
      profileImageUrl: updatedUser.profileImageUrl,
      bio: updatedUser.bio,
      interests: updatedUser.interests || []
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error('Create profile error:', err);
    res.status(500).json({ message: 'Failed to create profile' });
  }
};

// ✅ Get Public Profiles
const getPublicProfiles = async (req, res) => {
  try {
    const users = await User.find({
      profileImageUrl: { $exists: true, $ne: '' },
      profileCreated: true
    }).select('_id fullName profileImageUrl bio interests').limit(10);

    res.status(200).json(users);
  } catch (err) {
    console.error('Get public profiles error:', err);
    res.status(500).json({ message: 'Failed to fetch public profiles' });
  }
};

// ✅ Get User by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('_id fullName email phone bio profileImageUrl interests');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    console.error('Get user by ID error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Get Nearby Users
const getNearbyUsers = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const userId = req.user._id;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const users = await User.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: 10000
        }
      },
      _id: { $ne: userId },
      profileCreated: true
    }).select('_id fullName bio profileImageUrl location interests');

    res.json(users);
  } catch (err) {
    console.error('Get nearby users error:', err);
    res.status(500).json({ message: 'Failed to fetch nearby users' });
  }
};

// ✅ Update User Location
const updateUserLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude required' });
    }

    const location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { location },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'Location updated', user: updatedUser });
  } catch (err) {
    console.error('Update location error:', err);
    res.status(500).json({ message: 'Failed to update location' });
  }
};

// ✅ Update User Profile
const updateUserProfile = async (req, res) => {
  try {
    const { userId, bio, interests } = req.body;

    let parsedInterests;
    if (typeof interests !== 'undefined') {
      try {
        parsedInterests = typeof interests === 'string' ? JSON.parse(interests) : interests;
      } catch {
        parsedInterests = [];
      }
    }

    const updateData = { bio };
    if (parsedInterests) updateData.interests = parsedInterests;

    if (req.file) {
      updateData.profileImageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = jwt.sign({ _id: updatedUser._id, isAdmin: updatedUser.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Profile updated',
      token,
      _id: updatedUser._id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      isAdmin: updatedUser.isAdmin,
      profileCreated: updatedUser.profileCreated || false,
      profileImageUrl: updatedUser.profileImageUrl || '',
      bio: updatedUser.bio || '',
      contactNo: updatedUser.contactNo || updatedUser.phone || '',
      interests: updatedUser.interests || []
    });
  } catch (err) {
    console.error('❌ Profile update error:', err.message);
    res.status(500).json({ message: err.message || 'Failed to update profile' });
  }
};

// ✅ ADMIN: Get All Users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// ✅ ADMIN: Delete User
const deleteUserById = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

module.exports = {
  createProfile,
  getPublicProfiles,
  getUserById,
  getNearbyUsers,
  updateUserLocation,
  updateUserProfile,
  getAllUsers,
  deleteUserById
};
