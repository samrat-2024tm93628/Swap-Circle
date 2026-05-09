const router = require('express').Router();
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const verifyToken = require('../middleware/verifyToken');

router.get('/stats/:userId', async (req, res) => {
  try {
    const txs = await CreditTransaction.find({ userId: req.params.userId });
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const sum = (type) => txs.filter(t => t.type === type).reduce((acc, t) => acc + t.amount, 0);

    res.json({
      currentBalance: user.timeCredits,
      totalBought: sum('buy'),
      totalRedeemed: sum('redeem'),
      totalReceived: sum('received'),
      totalSpent: sum('sent'),
      totalEarned: sum('buy') + sum('received'),
      transactionCount: txs.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const txs = await CreditTransaction.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(txs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/buy', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ message: 'Minimum purchase is ₹1' });
    if (amount > 10000) return res.status(400).json({ message: 'Maximum purchase is ₹10,000' });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { timeCredits: amount } },
      { new: true }
    ).select('-password');

    await CreditTransaction.create({
      userId: req.user.id,
      type: 'buy',
      amount,
      description: `Purchased ${amount} credits for ₹${amount}`,
    });

    res.json({ user, message: `${amount} credits added to your wallet` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/redeem', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 10) return res.status(400).json({ message: 'Minimum redemption is 10 credits (₹10)' });

    const user = await User.findById(req.user.id);
    if (user.timeCredits < amount) return res.status(400).json({ message: 'Insufficient credits' });

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { timeCredits: -amount } },
      { new: true }
    ).select('-password');

    await CreditTransaction.create({
      userId: req.user.id,
      type: 'redeem',
      amount,
      description: `Redeemed ${amount} credits for ₹${amount} (processing in 2-3 business days)`,
    });

    res.json({ user: updated, message: `₹${amount} redemption request submitted` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/pay', verifyToken, async (req, res) => {
  try {
    const { toUserId, toUserName, amount, listingTitle } = req.body;
    if (!toUserId || !amount || amount < 1) return res.status(400).json({ message: 'Invalid payment details' });
    if (toUserId === req.user.id) return res.status(400).json({ message: 'Cannot pay yourself' });

    const sender = await User.findById(req.user.id);
    if (sender.timeCredits < amount) return res.status(400).json({ message: 'Insufficient credits' });

    const receiver = await User.findById(toUserId);
    if (!receiver) return res.status(404).json({ message: 'User not found' });

    await User.findByIdAndUpdate(req.user.id, { $inc: { timeCredits: -amount } });
    await User.findByIdAndUpdate(toUserId, { $inc: { timeCredits: amount } });

    await CreditTransaction.create({
      userId: req.user.id,
      type: 'sent',
      amount,
      description: `Paid for: ${listingTitle}`,
      counterpartId: toUserId,
      counterpartName: toUserName,
    });

    await CreditTransaction.create({
      userId: toUserId,
      type: 'received',
      amount,
      description: `Payment for: ${listingTitle}`,
      counterpartId: req.user.id,
      counterpartName: req.user.name,
    });

    const updatedSender = await User.findById(req.user.id).select('-password');
    res.json({ user: updatedSender, message: `₹${amount} paid to ${toUserName}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
