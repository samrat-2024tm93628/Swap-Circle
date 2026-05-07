const mongoose = require('mongoose');

const swapSchema = new mongoose.Schema({
  proposerId: { type: String, required: true },
  proposerName: { type: String, required: true },
  receiverId: { type: String, required: true },
  receiverName: { type: String, required: true },
  offeredListingId: { type: String, required: true },
  offeredListingTitle: { type: String, required: true },
  requestedListingId: { type: String, required: true },
  requestedListingTitle: { type: String, required: true },
  message: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in-progress', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  proposerRating: { type: Number, default: null },
  receiverRating: { type: Number, default: null },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Swap', swapSchema);
