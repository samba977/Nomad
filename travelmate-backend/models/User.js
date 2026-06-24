const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },

  // ✅ FIXED: Renamed from governmentID to citizenshipId
  citizenshipId: { type: String, required: true, unique: true },
  governmentIDImage: { type: String, default: '' }, // keep this if you use image uploads

  isAdmin: { type: Boolean, default: false },

  // 👇 Profile-related fields
  bio: { type: String, default: '' },
  profileCreated: { type: Boolean, default: false },
  profileImageUrl: { type: String, default: '' },
  interests: { type: [String], default: [] },

  // ✅ Location for nearby users feature
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
}, {
  timestamps: true,
});

// ✅ Add geospatial index
userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
