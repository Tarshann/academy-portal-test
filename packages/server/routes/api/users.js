const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const { protect } = require('../../middleware/auth');

// @route   GET /api/users/search
// @desc    Search users
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.user.id }
    })
    .select('firstName lastName email profileImage')
    .limit(10);

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/push-token
// @desc    Store user push token
// @access  Private
router.post('/push-token', protect, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Push token is required' });
    }
    
    // Update user with push token
    await User.findByIdAndUpdate(req.user.id, {
      pushToken: token
    });
    
    res.json({ message: 'Push token updated successfully' });
  } catch (error) {
    console.error('Error updating push token:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 