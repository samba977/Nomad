const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const {
  createProfile,
  getPublicProfiles,
  getUserById,
  getNearbyUsers,
  updateUserLocation,
  updateUserProfile,
  getAllUsers,
  deleteUserById
} = require('../controllers/userController');

// ✅ Multer setup for profile image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// 🔓 Public profile routes
router.post('/create-profile', upload.single('profileImage'), createProfile);
router.post('/update-profile', upload.single('profileImage'), updateUserProfile);
router.get('/public-profiles', getPublicProfiles);

// ✅ Authenticated actions
router.put('/location/:id', protect, updateUserLocation);
router.get('/nearby', protect, getNearbyUsers);

// ✅ 🛡️ ADMIN ROUTES
router.get('/admin/users', protect, adminOnly, getAllUsers);
router.delete('/admin/users/:id', protect, adminOnly, deleteUserById);

// ✅ View any public profile by ID
router.get('/:id', getUserById);

module.exports = router;
