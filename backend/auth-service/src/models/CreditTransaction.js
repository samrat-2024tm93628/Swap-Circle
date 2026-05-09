const mongoose = require('mongoose');

const txSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['buy', 'redeem', 'sent', 'received'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  counterpartId: { type: String, default: null },
  counterpartName: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('CreditTransaction', txSchema);
