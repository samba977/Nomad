// routes/groupRoutes.js
const express = require('express');
const {
  // Groups
  createGroup,
  getGroupsByUser,
  addMemberToGroup,
  removeMemberFromGroup,
  leaveGroup,
  deleteGroup,
  transferAdmin,
  // Polls (equal-split cost poll)
  createPoll,
  listPolls,
  votePoll,
  closePoll,
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GROUP CRUD
 */
// Create
router.post('/create', protect, createGroup);

// Read (all groups for a user)
router.get('/:userId', protect, getGroupsByUser);

// Update
router.post('/:groupId/add-member', protect, addMemberToGroup);
router.post('/:groupId/remove-member/:userId', protect, removeMemberFromGroup);
router.post('/leave/:groupId', protect, leaveGroup);
router.post('/:groupId/transfer-admin', protect, transferAdmin);

// Delete
router.delete('/:groupId', protect, deleteGroup);

/**
 * POLLS (group-only, admin-initiated, equal split)
 */
router.post('/:groupId/polls', protect, createPoll);                 // create cost split poll
router.get('/:groupId/polls', protect, listPolls);                   // list open + history
router.post('/:groupId/polls/:pollId/vote', protect, votePoll);      // vote agree / reject
router.post('/:groupId/polls/:pollId/close', protect, closePoll);    // close as FAILED/EXPIRED

module.exports = router;
