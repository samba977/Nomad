const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  total: { type: Number, required: true, min: 0.01 },
  currency: { type: String, default: 'NPR' },
  notes: { type: String, default: '' },

  // snapshot of participants at create time
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],

  status: { type: String, enum: ['OPEN', 'PASSED', 'FAILED', 'EXPIRED'], default: 'OPEN' },
  perPerson: { type: Number, required: true }, // computed from total / participants.length (2 dp)

  // vote tracking
  tally: {
    agree: { type: Number, default: 0 },
    reject: { type: Number, default: 0 },
    voted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },

  expiresAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Poll', pollSchema);
