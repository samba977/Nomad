// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'senderModel' },
    receiverId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'receiverModel' },
    receiverModel: { type: String, required: true, enum: ['User', 'Group'] },
    senderModel: { type: String, default: 'User' },
    text: { type: String, required: true },
    location: { type: String },
    read: { type: Boolean, default: false },

    // NEW: per-user soft delete / hide
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  },
  { timestamps: true }
);

// (Optional but recommended) index for faster queries
messageSchema.index({ receiverModel: 1, senderId: 1, receiverId: 1, deletedFor: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
