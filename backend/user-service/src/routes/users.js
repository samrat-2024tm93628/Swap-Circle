const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile');

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

router.get('/:userId', async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.params.userId });
    if (!profile) {
      try {
        profile = await Profile.create({ userId: req.params.userId });
      } catch (createErr) {
        if (createErr.code === 11000) {
          profile = await Profile.findOne({ userId: req.params.userId });
        } else {
          throw createErr;
        }
      }
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:userId', auth, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId)
      return res.status(403).json({ message: 'Forbidden' });

    const { bio, skills, location } = req.body;
    const profile = await Profile.findOneAndUpdate(
      { userId: req.params.userId },
      { bio, skills, location },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:userId/rating', async (req, res) => {
  try {
    const { rating } = req.body;
    const profile = await Profile.findOne({ userId: req.params.userId });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const newCount = profile.ratingCount + 1;
    const newRating = ((profile.rating * profile.ratingCount) + rating) / newCount;

    const updated = await Profile.findOneAndUpdate(
      { userId: req.params.userId },
      {
        rating: Math.round(newRating * 10) / 10,
        ratingCount: newCount,
        $inc: { completedSwaps: 1, [`ratingBreakdown.${rating}`]: 1 },
      },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
