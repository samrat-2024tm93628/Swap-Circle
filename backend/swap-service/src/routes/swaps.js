const router = require('express').Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const Swap = require('../models/Swap');

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

router.post('/', auth, async (req, res) => {
  try {
    const { offeredListingId, requestedListingId, receiverId, receiverName, message } = req.body;

    const [offeredRes, requestedRes] = await Promise.all([
      axios.get(`${process.env.LISTING_SERVICE_URL}/listings/${offeredListingId}`),
      axios.get(`${process.env.LISTING_SERVICE_URL}/listings/${requestedListingId}`)
    ]);

    const offered = offeredRes.data;
    const requested = requestedRes.data;

    if (offered.userId !== req.user.id)
      return res.status(403).json({ message: 'You can only offer your own listings' });

    if (requested.userId !== receiverId)
      return res.status(400).json({ message: 'Receiver mismatch' });

    const existing = await Swap.findOne({
      offeredListingId,
      requestedListingId,
      status: { $in: ['pending', 'accepted', 'in-progress'] }
    });
    if (existing) return res.status(409).json({ message: 'An active swap already exists for these listings' });

    const swap = await Swap.create({
      proposerId: req.user.id,
      proposerName: req.user.name,
      receiverId,
      receiverName,
      offeredListingId,
      offeredListingTitle: offered.title,
      requestedListingId,
      requestedListingTitle: requested.title,
      message: message || ''
    });

    res.status(201).json(swap);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/mine', auth, async (req, res) => {
  try {
    const swaps = await Swap.find({
      $or: [{ proposerId: req.user.id }, { receiverId: req.user.id }]
    }).sort({ createdAt: -1 });
    res.json(swaps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: 'Swap not found' });
    if (swap.proposerId !== req.user.id && swap.receiverId !== req.user.id)
      return res.status(403).json({ message: 'Forbidden' });
    res.json(swap);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/accept', auth, async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: 'Not found' });
    if (swap.receiverId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    if (swap.status !== 'pending') return res.status(400).json({ message: 'Swap is not pending' });

    swap.status = 'accepted';
    await swap.save();

    const serviceToken = `Bearer ${require('jsonwebtoken').sign(
      { id: 'system', name: 'system', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1m' }
    )}`;

    Promise.all([
      axios.put(`${process.env.LISTING_SERVICE_URL}/listings/${swap.offeredListingId}`,
        { status: 'in-swap' },
        { headers: { authorization: serviceToken } }
      ),
      axios.put(`${process.env.LISTING_SERVICE_URL}/listings/${swap.requestedListingId}`,
        { status: 'in-swap' },
        { headers: { authorization: serviceToken } }
      )
    ]).catch(() => {});

    res.json(swap);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/reject', auth, async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: 'Not found' });
    if (swap.receiverId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    if (swap.status !== 'pending') return res.status(400).json({ message: 'Swap is not pending' });

    swap.status = 'rejected';
    await swap.save();
    res.json(swap);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: 'Not found' });
    if (swap.proposerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    if (!['pending', 'accepted'].includes(swap.status))
      return res.status(400).json({ message: 'Cannot cancel at this stage' });

    const wasAccepted = swap.status === 'accepted';
    swap.status = 'cancelled';
    await swap.save();

    if (wasAccepted) {
      const serviceToken = `Bearer ${require('jsonwebtoken').sign(
        { id: 'system', name: 'system', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1m' }
      )}`;
      Promise.all([
        axios.put(`${process.env.LISTING_SERVICE_URL}/listings/${swap.offeredListingId}`,
          { status: 'active' },
          { headers: { authorization: serviceToken } }
        ),
        axios.put(`${process.env.LISTING_SERVICE_URL}/listings/${swap.requestedListingId}`,
          { status: 'active' },
          { headers: { authorization: serviceToken } }
        )
      ]).catch(() => {});
    }

    res.json(swap);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: 'Not found' });
    if (swap.proposerId !== req.user.id && swap.receiverId !== req.user.id)
      return res.status(403).json({ message: 'Forbidden' });
    if (swap.status !== 'accepted') return res.status(400).json({ message: 'Swap must be accepted first' });

    swap.status = 'completed';
    swap.completedAt = new Date();
    await swap.save();

    const serviceToken = `Bearer ${require('jsonwebtoken').sign(
      { id: 'system', name: 'system', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1m' }
    )}`;

    Promise.all([
      axios.put(`${process.env.LISTING_SERVICE_URL}/listings/${swap.offeredListingId}`,
        { status: 'completed' },
        { headers: { authorization: serviceToken } }
      ),
      axios.put(`${process.env.LISTING_SERVICE_URL}/listings/${swap.requestedListingId}`,
        { status: 'completed' },
        { headers: { authorization: serviceToken } }
      )
    ]).catch(() => {});

    res.json(swap);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/rate', auth, async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: 'Rating must be 1-5' });

    const swap = await Swap.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: 'Not found' });
    if (swap.status !== 'completed') return res.status(400).json({ message: 'Swap not completed' });

    const isProposer = swap.proposerId === req.user.id;
    const isReceiver = swap.receiverId === req.user.id;
    if (!isProposer && !isReceiver) return res.status(403).json({ message: 'Forbidden' });

    if (isProposer && swap.proposerRating) return res.status(400).json({ message: 'Already rated' });
    if (isReceiver && swap.receiverRating) return res.status(400).json({ message: 'Already rated' });

    const ratedUserId = isProposer ? swap.receiverId : swap.proposerId;
    if (isProposer) swap.proposerRating = rating;
    else swap.receiverRating = rating;
    await swap.save();

    await axios.patch(
      `${process.env.USER_SERVICE_URL}/users/${ratedUserId}/rating`,
      { rating }
    );

    res.json(swap);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/ratings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const swaps = await Swap.find({
      status: 'completed',
      $or: [
        { receiverId: userId, proposerRating: { $ne: null } },
        { proposerId: userId, receiverRating: { $ne: null } },
      ],
    }).sort({ completedAt: -1 });

    const reviews = swaps.map(s => {
      if (s.receiverId === userId && s.proposerRating != null) {
        return { rating: s.proposerRating, raterName: s.proposerName, service: s.requestedListingTitle, date: s.completedAt || s.updatedAt };
      }
      return { rating: s.receiverRating, raterName: s.receiverName, service: s.offeredListingTitle, date: s.completedAt || s.updatedAt };
    });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
