const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  type: { type: String, enum: ['offer', 'request'], required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Technology', 'Education', 'Home Services', 'Transportation', 'Arts & Creative', 'Food & Cooking', 'Health & Wellness', 'Other'],
    required: true
  },
  estimatedHours: { type: Number, required: true, min: 0.5 },
  tags: [String],
  status: { type: String, enum: ['active', 'in-swap', 'completed', 'cancelled'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);
