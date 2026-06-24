// sockets/chatSocket.js
// Full, production-ready socket server for 1-1 chat, group chat (rooms),
// and a backend IO bridge so controllers can emit poll/expense events.
//
// NOTE: If your folder layout is different, adjust the require('../utils/io') path.

const Message = require('../models/Message');
const Group = require('../models/Group');
const User = require('../models/User');
const { setIO } = require('../utils/io'); // <-- IO bridge so controllers can emit

// Track online users: userId -> socketId
const users = {};

function chatSocket(io) {
  // Expose io instance for controllers (polls/expenses) via utils/io.js
  setIO(io);

  io.on('connection', (socket) => {
    const userId = socket.handshake?.query?.userId;

    if (userId) {
      users[userId] = socket.id;
      // Optional: put this user in a personal room (for direct emits if needed)
      socket.join(`user:${userId}`);
      console.log(`✅ User connected: ${userId}`);
    } else {
      console.warn('⚠️ Connection attempted without userId');
    }

    // -----------------------------
    // Group room join/leave helpers
    // -----------------------------
    socket.on('group:join', ({ groupId }) => {
      if (!groupId) return;
      socket.join(String(groupId));
      // console.log(`➡️  Socket ${socket.id} joined group room ${groupId}`);
    });

    socket.on('group:leave', ({ groupId }) => {
      if (!groupId) return;
      socket.leave(String(groupId));
      // console.log(`⬅️  Socket ${socket.id} left group room ${groupId}`);
    });

    // -----------------------------
    // 1-to-1 message
    // -----------------------------
    socket.on('sendMessage', async ({ senderId, receiverId, text, receiverModel }) => {
      try {
        if (!senderId || !receiverId || !text || !receiverModel) return;

        const message = await Message.create({ senderId, receiverId, receiverModel, text });

        // Resolve sender's display name (optional)
        let senderName = 'Someone';
        try {
          const senderUser = await User.findById(senderId).lean();
          if (senderUser) senderName = senderUser.fullName || senderUser.name || 'Someone';
        } catch (_) {}

        // Emit to receiver (if online)
        const receiverSocketId = users[receiverId];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receiveMessage', {
            senderId,
            senderName,
            text,
            createdAt: message.createdAt,
          });
        } else {
          // Optionally queue notification if offline
        }

        // Echo to sender (for confirmation/delivery state)
        const senderSocketId = users[senderId];
        if (senderSocketId) {
          io.to(senderSocketId).emit('receiveMessage', {
            senderId,
            senderName,
            text,
            createdAt: message.createdAt,
          });
        }
      } catch (err) {
        console.error('❌ Error in sendMessage:', err.message);
      }
    });

    // -----------------------------
    // Group message (room broadcast)
    // -----------------------------
    socket.on('sendGroupMessage', async ({ senderId, groupId, text }) => {
      try {
        if (!senderId || !groupId || !text) return;

        const group = await Group.findById(groupId).select('_id').lean();
        if (!group) return;

        // Ensure the socket is in the room
        socket.join(String(groupId));

        const message = await Message.create({
          senderId,
          receiverId: groupId,
          receiverModel: 'Group',
          text,
        });

        // Resolve sender's display name (optional)
        let senderName = 'Someone';
        try {
          const senderUser = await User.findById(senderId).lean();
          if (senderUser) senderName = senderUser.fullName || senderUser.name || 'Someone';
        } catch (_) {}

        // Broadcast to everyone in the room
        io.to(String(groupId)).emit('receiveGroupMessage', {
          groupId: String(groupId),
          senderId,
          senderName,
          text,
          createdAt: message.createdAt,
        });
      } catch (err) {
        console.error('❌ Error in sendGroupMessage:', err.message);
      }
    });

    // -----------------------------
    // Typing indicator for 1-to-1
    // -----------------------------
    socket.on('typing', ({ from, to }) => {
      const receiverSocket = users[to];
      if (receiverSocket) {
        io.to(receiverSocket).emit('typing', { from });
      }
    });

    // -----------------------------
    // Fetch 1-to-1 history (optional RPC)
    // -----------------------------
    socket.on('getMessages', async ({ userId, selectedUserId }, callback) => {
      try {
        if (!userId || !selectedUserId) return callback?.([]);

        const msgs = await Message.find({
          receiverModel: 'User',
          $or: [
            { senderId: userId, receiverId: selectedUserId },
            { senderId: selectedUserId, receiverId: userId },
          ],
        })
          .sort({ createdAt: 1 })
          .lean();

        const formatted = msgs.map((m) => ({
          from: String(m.senderId) === String(userId) ? 'me' : 'them',
          text: m.text,
          createdAt: m.createdAt,
        }));

        callback?.(formatted);
      } catch (err) {
        console.error('❌ Error in getMessages:', err.message);
        callback?.([]);
      }
    });

    // -----------------------------
    // Cleanup on disconnect
    // -----------------------------
    socket.on('disconnect', () => {
      for (const id in users) {
        if (users[id] === socket.id) {
          delete users[id];
          // Optionally: socket.leaveAll();
          console.log(`🛑 User disconnected: ${id}`);
          break;
        }
      }
    });
  });
}

module.exports = chatSocket;
