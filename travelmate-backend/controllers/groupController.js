// controllers/groupController.js
// Full controller: Groups CRUD + Polls (equal split) + Expense generation

const mongoose = require('mongoose');
const Group = require('../models/Group');
const Poll = require('../models/Poll');
const Expense = require('../models/Expense');
const { getIO } = require('../utils/io');

let zodValidator;
try {
  zodValidator = require('../Validators/groupValidators');
} catch { /* optional */ }

// ---------- helpers ----------
const isOid = (id) => mongoose.Types.ObjectId.isValid(id);
const oid = (id) => new mongoose.Types.ObjectId(id);

// IMPORTANT: accept both _id and id from auth middleware; also allow adminId in body/query
const getRequesterId = (req) => (
  req.user?._id || req.user?.id || req.body.adminId || req.query.adminId || null
);

// Ensure an array of unique ObjectIds (as strings)
const uniqIds = (arr = []) => [...new Set(arr.map(String))].map(oid);
const round2 = (n) => Math.round(n * 100) / 100;

function computeEqualShares(total, participants) {
  const n = participants.length;
  if (!n) return { perPerson: 0, shares: [] };
  const per = round2(total / n);

  const shares = [];
  let running = 0;
  for (let i = 0; i < n; i++) {
    const amt = (i === n - 1) ? round2(total - running) : per;
    shares.push(amt);
    running = round2(running + amt);
  }
  return { perPerson: per, shares };
}

async function ensureGroupAdmin(groupId, requesterId) {
  const group = await Group.findById(groupId).select('_id adminId members');
  if (!group) return { error: 'Group not found' };
  if (String(group.adminId) !== String(requesterId)) {
    return { error: 'Only admin can perform this action' };
  }
  return { group };
}

// =================================================
//                      GROUPS
// =================================================

/**
 * POST /api/groups/create
 * Body: { name, members:[userId], createdBy, groupImage? }
 */
const createGroup = async (req, res) => {
  try {
    let data = req.body;
    if (zodValidator?.groupSchema) {
      data = zodValidator.groupSchema.parse(req.body);
    }

    const { name, members = [], createdBy, groupImage = '' } = data || {};
    if (!name || !createdBy || !isOid(createdBy)) {
      return res.status(400).json({ message: 'name and createdBy are required' });
    }

    const memberIds = uniqIds([createdBy, ...members.filter(isOid)]);

    const group = new Group({
      name,
      members: memberIds,
      createdBy: oid(createdBy),
      adminId: oid(createdBy),
      groupImage
    });

    await group.save();
    res.status(201).json(group);
  } catch (err) {
    if (err?.errors && Array.isArray(err.errors)) {
      return res.status(400).json({ message: err.errors[0]?.message || 'Validation failed' });
    }
    console.error('createGroup error:', err);
    res.status(500).json({ message: 'Failed to create group' });
  }
};

/**
 * GET /api/groups/:userId
 */
const getGroupsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isOid(userId)) return res.status(400).json({ message: 'Invalid userId' });

    const groups = await Group.find({ members: oid(userId) }).sort({ updatedAt: -1 });
    res.json(groups);
  } catch (err) {
    console.error('getGroupsByUser error:', err);
    res.status(500).json({ message: 'Failed to get groups' });
  }
};

/**
 * POST /api/groups/:groupId/add-member
 * Body: { userId }
 */
const addMemberToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const requesterId = getRequesterId(req);

    if (!isOid(groupId) || !isOid(userId)) {
      return res.status(400).json({ message: 'Invalid ids' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (String(group.adminId) !== String(requesterId)) {
      return res.status(403).json({ message: 'Only admin can add members' });
    }

    const before = group.members.map(String);
    if (!before.includes(String(userId))) {
      group.members.push(oid(userId));
      await group.save();
    }

    res.json(group);
  } catch (err) {
    console.error('addMemberToGroup error:', err);
    res.status(500).json({ message: 'Failed to add user' });
  }
};

/**
 * POST /api/groups/:groupId/remove-member/:userId
 */
const removeMemberFromGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const requesterId = getRequesterId(req);

    if (!isOid(groupId) || !isOid(userId) || !isOid(requesterId)) {
      return res.status(400).json({ message: 'Invalid ids' });
    }

    const group = await Group.findById(groupId).select('_id adminId members');
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (String(group.adminId) !== String(requesterId)) {
      return res.status(403).json({ message: 'Only admin can remove users' });
    }

    if (String(group.adminId) === String(userId)) {
      return res.status(400).json({ message: 'Admin cannot be removed' });
    }

    const before = group.members.length;
    group.members = group.members.filter(m => String(m) !== String(userId));
    if (group.members.length === before) {
      return res.status(404).json({ message: 'Member not in group' });
    }

    await group.save();
    res.json(group);
  } catch (err) {
    console.error('removeMemberFromGroup error:', err);
    res.status(500).json({ message: 'Failed to remove user' });
  }
};

/**
 * POST /api/groups/leave/:groupId
 * Body: { userId }
 */
const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!isOid(groupId) || !isOid(userId)) {
      return res.status(400).json({ message: 'Invalid ids' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const before = group.members.length;
    group.members = group.members.filter(m => String(m) !== String(userId));

    if (group.members.length === before) {
      return res.status(404).json({ message: 'You are not a member of this group' });
    }

    const isAdminLeaving = String(group.adminId) === String(userId);

    if (group.members.length === 0) {
      await group.deleteOne();
      return res.json({ message: 'Group deleted as last user left.' });
    }

    if (isAdminLeaving) {
      group.adminId = group.members[0];
    }

    await group.save();
    return res.json({ message: 'Left group successfully.', group });
  } catch (err) {
    console.error('leaveGroup error:', err);
    res.status(500).json({ message: 'Failed to leave group' });
  }
};

/**
 * DELETE /api/groups/:groupId
 * (send { data: { adminId } } in axios if needed)
 */
const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const requesterId = getRequesterId(req);

    if (!isOid(groupId) || !isOid(requesterId)) {
      return res.status(400).json({ message: 'Invalid ids' });
    }

    const group = await Group.findById(groupId).select('_id adminId');
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (String(group.adminId) !== String(requesterId)) {
      return res.status(403).json({ message: 'Only admin can delete the group' });
    }

    await group.deleteOne();
    res.json({ message: 'Group deleted.' });
  } catch (err) {
    console.error('deleteGroup error:', err);
    res.status(500).json({ message: 'Failed to delete group' });
  }
};

/**
 * POST /api/groups/:groupId/transfer-admin
 * Body: { newAdminId }
 */
const transferAdmin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { newAdminId } = req.body;
    const requesterId = getRequesterId(req);

    if (!isOid(groupId) || !isOid(newAdminId) || !isOid(requesterId)) {
      return res.status(400).json({ message: 'Invalid ids' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (String(group.adminId) !== String(requesterId)) {
      return res.status(403).json({ message: 'Only current admin can transfer admin role' });
    }

    if (!group.members.map(String).includes(String(newAdminId))) {
      return res.status(400).json({ message: 'New admin must be a group member' });
    }

    group.adminId = oid(newAdminId);
    await group.save();
    res.json({ message: 'Admin transferred', group });
  } catch (err) {
    console.error('transferAdmin error:', err);
    res.status(500).json({ message: 'Failed to transfer admin' });
  }
};

// =================================================
//                      POLLS
// =================================================

/**
 * POST /api/groups/:groupId/polls
 * Admin creates a cost split poll (equal split, snapshot participants)
 * Body: { total, currency?, notes?, participants?[] }
 */
const createPoll = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { total, currency = 'NPR', notes = '', participants } = req.body;
    const requesterId = getRequesterId(req);

    if (!isOid(groupId) || !isOid(requesterId))
      return res.status(400).json({ message: 'Invalid ids' });
    if (!(Number(total) > 0))
      return res.status(400).json({ message: 'Total must be > 0' });

    const { group, error } = await ensureGroupAdmin(groupId, requesterId);
    if (error) return res.status(403).json({ message: error });

    // One OPEN poll at a time
    const openCount = await Poll.countDocuments({ groupId, status: 'OPEN' });
    if (openCount > 0)
      return res.status(400).json({ message: 'There is already an OPEN poll in this group' });

    // Snapshot participants (default all members)
    const snapshot = (Array.isArray(participants) && participants.length > 0)
      ? participants.filter(isOid).map(oid)
      : group.members;

    if (!snapshot || snapshot.length < 2)
      return res.status(400).json({ message: 'At least 2 participants required' });

    const { perPerson } = computeEqualShares(Number(total), snapshot);
    if (perPerson <= 0) return res.status(400).json({ message: 'Invalid split' });

    const poll = await Poll.create({
      groupId: oid(groupId),
      createdBy: oid(requesterId),
      total: round2(Number(total)),
      currency,
      notes,
      participants: snapshot,
      status: 'OPEN',
      perPerson,
      tally: { agree: 0, reject: 0, voted: [] }
    });

    const io = getIO();
    io && io.to(String(groupId)).emit('poll:created', { groupId: String(groupId), poll });

    return res.status(201).json(poll);
  } catch (err) {
    console.error('createPoll error:', err);
    return res.status(500).json({ message: 'Failed to create poll' });
  }
};

/**
 * GET /api/groups/:groupId/polls
 */
const listPolls = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!isOid(groupId)) return res.status(400).json({ message: 'Invalid groupId' });

    const polls = await Poll.find({ groupId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const open = polls.filter(p => p.status === 'OPEN');
    const closed = polls.filter(p => p.status !== 'OPEN');
    return res.json([...open, ...closed]);
  } catch (err) {
    console.error('listPolls error:', err);
    return res.status(500).json({ message: 'Failed to list polls' });
  }
};

/**
 * POST /api/groups/:groupId/polls/:pollId/vote
 * Body: { choice: 'agree' | 'reject' }
 * Simple majority passes; on PASS → create Expense (equal split)
 */
const votePoll = async (req, res) => {
  try {
    const { groupId, pollId } = req.params;
    const { choice } = req.body;
    const voterId = getRequesterId(req);

    if (!isOid(groupId) || !isOid(pollId) || !isOid(voterId))
      return res.status(400).json({ message: 'Invalid ids' });
    if (!['agree', 'reject'].includes(String(choice)))
      return res.status(400).json({ message: 'Invalid vote' });

    const poll = await Poll.findById(pollId);
    if (!poll || String(poll.groupId) !== String(groupId))
      return res.status(404).json({ message: 'Poll not found' });
    if (poll.status !== 'OPEN')
      return res.status(400).json({ message: 'Poll is not OPEN' });

    if (!poll.participants.map(String).includes(String(voterId)))
      return res.status(403).json({ message: 'Not a participant of this poll' });

    if (poll.tally.voted.map(String).includes(String(voterId)))
      return res.status(400).json({ message: 'Already voted' });

    if (choice === 'agree') poll.tally.agree += 1;
    else poll.tally.reject += 1;
    poll.tally.voted.push(oid(voterId));
    await poll.save();

    const io = getIO();
    io && io.to(String(groupId)).emit('poll:voted', {
      groupId: String(groupId),
      pollId: String(pollId),
      tally: { agree: poll.tally.agree, reject: poll.tally.reject, total: poll.participants.length }
    });

    // simple majority
    const majority = poll.tally.agree > (poll.participants.length / 2);
    if (majority) {
      poll.status = 'PASSED';
      await poll.save();

      const { shares: amounts } = computeEqualShares(poll.total, poll.participants);
      const shares = poll.participants.map((uid, idx) => ({
        userId: uid,
        amount: amounts[idx]
      }));

      const expense = await Expense.create({
        groupId: oid(groupId),
        pollId: poll._id,
        payerId: poll.createdBy,
        total: poll.total,
        currency: poll.currency,
        participants: poll.participants,
        perPerson: poll.perPerson,
        shares
      });

      io && io.to(String(groupId)).emit('poll:passed', {
        groupId: String(groupId),
        pollId: String(poll._id),
        expenseSummary: {
          pollId: String(poll._id),
          total: poll.total,
          currency: poll.currency,
          count: poll.participants.length,
          perPerson: poll.perPerson
        }
      });

      io && io.to(String(groupId)).emit('expense:created', {
        groupId: String(groupId),
        expense
      });

      return res.json({ poll, expense });
    }

    return res.json({ poll });
  } catch (err) {
    console.error('votePoll error:', err);
    return res.status(500).json({ message: 'Failed to vote' });
  }
};

/**
 * POST /api/groups/:groupId/polls/:pollId/close
 * Body: { status: 'FAILED' | 'EXPIRED' }
 * Admin-only manual close/expire.
 */
const closePoll = async (req, res) => {
  try {
    const { groupId, pollId } = req.params;
    const { status } = req.body;
    const requesterId = getRequesterId(req);

    if (!isOid(groupId) || !isOid(pollId) || !isOid(requesterId))
      return res.status(400).json({ message: 'Invalid ids' });
    if (!['FAILED', 'EXPIRED'].includes(String(status)))
      return res.status(400).json({ message: 'Invalid status' });

    const { error } = await ensureGroupAdmin(groupId, requesterId);
    if (error) return res.status(403).json({ message: error });

    const poll = await Poll.findById(pollId);
    if (!poll || String(poll.groupId) !== String(groupId))
      return res.status(404).json({ message: 'Poll not found' });
    if (poll.status !== 'OPEN')
      return res.status(400).json({ message: 'Poll already closed' });

    poll.status = status;
    await poll.save();

    const io = getIO();
    io && io.to(String(groupId)).emit('poll:closed', {
      groupId: String(groupId),
      pollId: String(pollId),
      status
    });

    return res.json({ poll });
  } catch (err) {
    console.error('closePoll error:', err);
    return res.status(500).json({ message: 'Failed to close poll' });
  }
};

module.exports = {
  // groups
  createGroup,
  getGroupsByUser,
  addMemberToGroup,
  removeMemberFromGroup,
  leaveGroup,
  deleteGroup,
  transferAdmin,
  // polls
  createPoll,
  listPolls,
  votePoll,
  closePoll,
};
