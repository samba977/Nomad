const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  uploadEventImage,
  getAllEventImages,
  deleteEventImage
} = require('../controllers/eventImageController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// ✅ Setup multer for saving files in 'uploads/' folder with original name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// ✅ Upload a new event image
router.post(
  '/upload',
  protect,
  adminOnly,
  upload.single('eventImage'),
  uploadEventImage
);

// ✅ Get all event images
router.get('/all', getAllEventImages);

// ✅ Delete an event image
router.delete('/:id', protect, adminOnly, deleteEventImage);

module.exports = router;
