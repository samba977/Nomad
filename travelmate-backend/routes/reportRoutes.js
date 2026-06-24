const express = require('express');
const { reportChat, getAllChatReports, deleteChatReport } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// User reports a chat message
router.post('/chat', protect, reportChat);

// Admin fetches all chat reports
router.get('/admin/chat', protect, adminOnly, getAllChatReports);

// Admin deletes a chat report
router.delete('/admin/chat/:id', protect, adminOnly, deleteChatReport);

module.exports = router;
