const express = require('express');
const router = express.Router();
const {
  getAllDestinations,
  addDestination,
  deleteDestination,
} = require('../controllers/destinationController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ✅ Public: Get all destinations
router.get('/', getAllDestinations);

// 🔐 Admin: Add destination
router.post('/', protect, adminOnly, addDestination);

// 🔐 Admin: Delete destination
router.delete('/:id', protect, adminOnly, deleteDestination);

module.exports = router;
