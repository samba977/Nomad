// routes/chatRoutes.js
const express = require('express');
const {
  sendMessage,
  getMessages,
  sendGroupMessage,
  getGroupMessages,
  getChatCompanions,
  markMessagesRead,
  hideChatForMe,
} = require('../controllers/chatController');

const validateObjectId = require('../middleware/validateObjectId');
// const { protect } = require('../middleware/authMiddleware'); // enable when ready

const router = express.Router();

// ----- Create messages -----
router.post('/', /*protect,*/ sendMessage);             // 1-to-1
router.post('/group', /*protect,*/ sendGroupMessage);   // Group

// ----- Read messages -----
router.get('/group/:groupId', /*protect,*/ validateObjectId, getGroupMessages); // ?userId=... optional
router.get('/companions/:userId', /*protect,*/ validateObjectId, getChatCompanions);
router.get('/:userId/:companionId', /*protect,*/ validateObjectId, getMessages);

// ----- Update message state -----
router.put('/mark-read/:userId/:companionId', /*protect,*/ validateObjectId, markMessagesRead);

// ----- Soft-delete (hide) a 1-to-1 chat for me -----
router.patch('/hide/:userId/:companionId', /*protect,*/ validateObjectId, hideChatForMe);

// (Optional) add an unhide later if you want to restore hidden threads
// router.patch('/unhide/:userId/:companionId', /*protect,*/ validateObjectId, unhideChatForMe);

module.exports = router;
