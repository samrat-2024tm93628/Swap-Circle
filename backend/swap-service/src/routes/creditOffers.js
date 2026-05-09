const router = require('express').Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const CreditOffer = require('../models/CreditOffer');

const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const serviceToken = () => `Bearer ${jwt.sign(
  { id: 'system', name: 'system', role: 'admin' },
  process.env.JWT_SECRET,
  { expiresIn: '1m' }
)}`;

router.post('/', auth, async (req, res) => {
  try {
    const { listingId, listingTitle, sellerId, sellerName, proposedAmount, message } = req.body;
    if (!listingId || !sellerId || !proposedAmount || proposedAmount < 1)
      return res.status(400).json({ message: 'Invalid offer details' });
    if (sellerId === req.user.id)
      return res.status(400).json({ message: 'Cannot make offer on your own listing' });

    const existing = await CreditOffer.findOne({
      listingId,
      buyerId: req.user.id,
      status: { $in: ['pending', 'countered'] },
    });
    if (existing) return res.status(409).json({ message: 'You already have an active offer on this listing' });

    const offer = await CreditOffer.create({
      listingId,
      listingTitle,
      buyerId: req.user.id,
      buyerName: req.user.name,
      sellerId,
      sellerName,
      proposedAmount,
      message: message || '',
    });
    res.status(201).json(offer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/mine', auth, async (req, res) => {
  try {
    const offers = await CreditOffer.find({
      $or: [{ buyerId: req.user.id }, { sellerId: req.user.id }],
    }).sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/accept', auth, async (req, res) => {
  try {
    const offer = await CreditOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Not found' });
    if (offer.sellerId !== req.user.id) return res.status(403).json({ message: 'Only the seller can accept' });
    if (!['pending', 'countered'].includes(offer.status))
      return res.status(400).json({ message: 'Offer is no longer active' });

    const finalAmount = offer.status === 'countered' ? offer.counterAmount : offer.proposedAmount;

    await axios.post(
      `${process.env.AUTH_SERVICE_URL}/auth/credits/internal-transfer`,
      { fromUserId: offer.buyerId, toUserId: offer.sellerId, amount: finalAmount, listingTitle: offer.listingTitle },
      { headers: { authorization: serviceToken() } }
    );

    offer.status = 'accepted';
    offer.finalAmount = finalAmount;
    await offer.save();
    res.json(offer);
  } catch (err) {
    res.status(500).json({ message: err.response?.data?.message || err.message });
  }
});

router.patch('/:id/counter', auth, async (req, res) => {
  try {
    const { counterAmount } = req.body;
    if (!counterAmount || counterAmount < 1) return res.status(400).json({ message: 'Invalid counter amount' });

    const offer = await CreditOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Not found' });
    if (offer.sellerId !== req.user.id) return res.status(403).json({ message: 'Only the seller can counter' });
    if (offer.status !== 'pending') return res.status(400).json({ message: 'Can only counter a pending offer' });

    offer.counterAmount = counterAmount;
    offer.status = 'countered';
    await offer.save();
    res.json(offer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/lock', auth, async (req, res) => {
  try {
    const offer = await CreditOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Not found' });
    if (offer.buyerId !== req.user.id) return res.status(403).json({ message: 'Only the buyer can lock the deal' });
    if (offer.status !== 'countered') return res.status(400).json({ message: 'No counter offer to accept' });

    await axios.post(
      `${process.env.AUTH_SERVICE_URL}/auth/credits/internal-transfer`,
      { fromUserId: offer.buyerId, toUserId: offer.sellerId, amount: offer.counterAmount, listingTitle: offer.listingTitle },
      { headers: { authorization: serviceToken() } }
    );

    offer.status = 'accepted';
    offer.finalAmount = offer.counterAmount;
    await offer.save();
    res.json(offer);
  } catch (err) {
    res.status(500).json({ message: err.response?.data?.message || err.message });
  }
});

router.patch('/:id/reject', auth, async (req, res) => {
  try {
    const offer = await CreditOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Not found' });
    if (offer.buyerId !== req.user.id && offer.sellerId !== req.user.id)
      return res.status(403).json({ message: 'Forbidden' });
    if (!['pending', 'countered'].includes(offer.status))
      return res.status(400).json({ message: 'Offer is no longer active' });

    offer.status = 'rejected';
    await offer.save();
    res.json(offer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
