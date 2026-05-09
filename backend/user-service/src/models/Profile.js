const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  bio: { type: String, default: '' },
  skills: [String],
  location: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  ratingBreakdown: {
    1: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    5: { type: Number, default: 0 },
  },
  completedSwaps: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
