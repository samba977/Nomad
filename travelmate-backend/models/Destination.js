const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Beach', 'Mountain', 'Adventure', 'Historical', 'Other'], required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  link: { type: String },   // <-- Add this line (optional field)
}, {
  timestamps: true
});

module.exports = mongoose.model('Destination', destinationSchema);
