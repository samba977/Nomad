// models/UserReport.js
const mongoose = require('mongoose');

const UserReportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: {
      type: String,
      enum: ['Harassment', 'Spam', 'Inappropriate Content', 'Scammer/Fraud', 'Fake Profile', 'Other'],
      required: true
    },
    details: { type: String, default: '' },
    evidenceUrls: [{ type: String }],

    status: { type: String, enum: ['open', 'reviewing', 'resolved', 'rejected'], default: 'open' },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin who updates
    adminNotes: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserReport', UserReportSchema);
