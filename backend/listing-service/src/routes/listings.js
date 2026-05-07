const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Listing = require('../models/Listing');

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

router.get('/', async (req, res) => {
  try {
    const { type, category, status, search } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    else filter.status = 'active';
    if (search) filter.title = { $regex: search, $options: 'i' };

    const listings = await Listing.find(filter).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/user/:userId', auth, async (req, res) => {
  try {
    const listings = await Listing.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, type, estimatedHours, tags } = req.body;
    const listing = await Listing.create({
      userId: req.user.id,
      userName: req.user.name,
      title, description, category, type, estimatedHours,
      tags: tags || []
    });
    res.status(201).json(listing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Not found' });
    if (listing.userId !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Forbidden' });

    const updated = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Not found' });
    if (listing.userId !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Forbidden' });

    await listing.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
