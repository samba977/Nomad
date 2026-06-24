const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const {
  addBlog,
  getUserBlogs,
  getBlogById,
  getAllBlogs,
  deleteBlog,
  updateBlog
} = require('../controllers/blogController');

// ✅ Multer config for blog images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ✅ POST: Add blog (supports multiple images)
router.post('/add', upload.array('images', 5), addBlog);

// ✅ GET: All blogs by user ID
router.get('/user/:id', getUserBlogs);

// ✅ PUBLIC: All blogs
router.get('/all', getAllBlogs);

// ✅ ADMIN: Get all blogs
router.get('/admin/all', protect, adminOnly, getAllBlogs); // 🔐 ADMIN ONLY

// ✅ ADMIN: Delete blog
router.delete('/admin/:id', protect, adminOnly, deleteBlog); // 🔐 ADMIN DELETE

// ✅ GET: Single blog
router.get('/:id', getBlogById);

// ✅ PUT: Update blog
router.put('/:id', updateBlog);

module.exports = router;
