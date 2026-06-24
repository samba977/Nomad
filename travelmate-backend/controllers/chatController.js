// controllers/chatController.js
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');

// ---------- helpers ----------
const oid = (id) => new mongoose.Types.ObjectId(id);
const isOid = (id) => mongoose.Types.ObjectId.isValid(id);

// ---------- 1-to-1: send ----------
const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, text, receiverModel = 'User', senderModel = 'User', location } = req.body;

    if (!senderId || !receiverId || !text || !receiverModel) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!isOid(senderId) || !isOid(receiverId)) {
      return res.status(400).json({ message: 'Invalid sender/receiver id' });
    }

    const msg = new Message({
      senderId: oid(senderId),
      receiverId: oid(receiverId),
      receiverModel,
      senderModel,
      text,
      location,
      read: false,
    });

    const saved = await msg.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('❌ sendMessage error:', err);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// ---------- 1-to-1: fetch thread (excludes chats hidden for requester) ----------
const getMessages = async (req, res) => {
  try {
    const { userId, companionId } = req.params;

    if (!isOid(userId) || !isOid(companionId)) {
      return res.status(400).json({ message: 'Invalid user ID(s)' });
    }

    const messages = await Message.find({
      receiverModel: 'User',
      deletedFor: { $ne: oid(userId) }, // exclude messages hidden for me
      $or: [
        { senderId: oid(userId), receiverId: oid(companionId) },
        { senderId: oid(companionId), receiverId: oid(userId) },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    console.error('❌ getMessages error:', err);
    res.status(500).json({ message: 'Failed to load messages' });
  }
};

// ---------- Group: send ----------
const sendGroupMessage = async (req, res) => {
  try {
    const { senderId, groupId, text, location } = req.body;

    if (!senderId || !groupId || !text) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!isOid(senderId) || !isOid(groupId)) {
      return res.status(400).json({ message: 'Invalid sender/group id' });
    }

    const msg = new Message({
      senderId: oid(senderId),
      receiverId: oid(groupId),
      receiverModel: 'Group',
      senderModel: 'User',
      text,
      location,
      read: false,
    });

    const saved = await msg.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('❌ sendGroupMessage error:', err);
    res.status(500).json({ message: 'Failed to send group message' });
  }
};

// ---------- Group: fetch thread (optionally excludes hidden if ?userId=...) ----------
const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.query; // optional

    if (!isOid(groupId)) return res.status(400).json({ message: 'Invalid group ID format' });

    const filter = {
      receiverId: oid(groupId),
      receiverModel: 'Group',
    };
    if (userId && isOid(userId)) {
      filter.deletedFor = { $ne: oid(userId) };
    }

    const messages = await Message.find(filter).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error('❌ getGroupMessages error:', err);
    res.status(500).json({ message: 'Failed to load group messages' });
  }
};

// ---------- Companions (unique users I have chatted with) with unread counts ----------
const getChatCompanions = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isOid(userId)) return res.status(400).json({ message: 'Invalid userId' });

    // Find all 1-to-1 messages where user is involved and hasn't hidden them
    const msgs = await Message.find({
      receiverModel: 'User',
      deletedFor: { $ne: oid(userId) },
      $or: [{ senderId: oid(userId) }, { receiverId: oid(userId) }],
    }).select('senderId receiverId');

    // Unique counterpart IDs
    const ids = new Set();
    for (const m of msgs) {
      const s = String(m.senderId);
      const r = String(m.receiverId);
      if (s !== userId) ids.add(s);
      if (r !== userId) ids.add(r);
    }
    const companionIds = Array.from(ids).map(oid);

    if (companionIds.length === 0) return res.json([]);

    // Basic profile info
    const companions = await User.find({ _id: { $in: companionIds } })
      .select('_id fullName profileImageUrl');

    // Unread counts (exclude hidden)
    const result = await Promise.all(
      companions.map(async (c) => {
        const unread = await Message.countDocuments({
          senderId: c._id,
          receiverId: oid(userId),
          receiverModel: 'User',
          read: false,
          deletedFor: { $ne: oid(userId) },
        });
        return {
          _id: c._id,
          fullName: c.fullName,
          profileImageUrl: c.profileImageUrl,
          unreadMessages: unread,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error('❌ getChatCompanions error:', err);
    res.status(500).json({ message: 'Failed to fetch chat companions' });
  }
};

// ---------- Mark messages as read ----------
const markMessagesRead = async (req, res) => {
  try {
    const { userId, companionId } = req.params;
    if (!isOid(userId) || !isOid(companionId)) {
      return res.status(400).json({ message: 'Invalid user ID(s)' });
    }

    await Message.updateMany(
      {
        senderId: oid(companionId),
        receiverId: oid(userId),
        receiverModel: 'User',
        read: false,
        deletedFor: { $ne: oid(userId) }, // skip messages I hid
      },
      { $set: { read: true } }
    );

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error('❌ markMessagesRead error:', err);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};

// ---------- Hide/remove a 1-to-1 chat for me (soft delete) ----------
const hideChatForMe = async (req, res) => {
  try {
    const { userId, companionId } = req.params;
    if (!isOid(userId) || !isOid(companionId)) {
      return res.status(400).json({ message: 'Invalid user ID(s)' });
    }

    const result = await Message.updateMany(
      {
        receiverModel: 'User',
        deletedFor: { $ne: oid(userId) },
        $or: [
          { senderId: oid(userId), receiverId: oid(companionId) },
          { senderId: oid(companionId), receiverId: oid(userId) },
        ],
      },
      { $addToSet: { deletedFor: oid(userId) } }
    );

    res.json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('❌ hideChatForMe error:', err);
    res.status(500).json({ message: 'Failed to hide chat' });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  sendGroupMessage,
  getGroupMessages,
  getChatCompanions,
  markMessagesRead,
  hideChatForMe,
};
