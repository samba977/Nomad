const mongoose = require('mongoose');

const chatReportSchema = new mongoose.Schema({
  // The message being reported (reference to Message model)
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true },

  // User who made the report
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // The user being reported (the sender of the message)
  reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Reason for reporting
  reason: { type: String, required: true },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ChatReport', chatReportSchema);
