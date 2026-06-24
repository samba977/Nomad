const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  pollId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Poll',  required: true },

  payerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  total:    { type: Number, required: true, min: 0.01 },
  currency: { type: String, default: 'NPR' },

  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  perPerson:    { type: Number, required: true },

  shares: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
