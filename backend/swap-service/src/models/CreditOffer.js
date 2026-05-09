const mongoose = require('mongoose');

const creditOfferSchema = new mongoose.Schema({
  listingId: { type: String, required: true },
  listingTitle: { type: String, required: true },
  buyerId: { type: String, required: true },
  buyerName: { type: String, required: true },
  sellerId: { type: String, required: true },
  sellerName: { type: String, required: true },
  proposedAmount: { type: Number, required: true },
  counterAmount: { type: Number, default: null },
  finalAmount: { type: Number, default: null },
  message: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'countered', 'accepted', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('CreditOffer', creditOfferSchema);
