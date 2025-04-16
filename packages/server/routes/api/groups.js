const express = require('express');
const router = express.Router();
const Group = require('../../models/Group');
const { protect } = require('../../middleware/auth');

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, members } = req.body;

    const group = new Group({
      name: name || 'New Group',
      owner: req.user.id,
      members: [
        { user: req.user.id, role: 'owner' },
        ...members.map(userId => ({ user: userId, role: 'member' }))
      ]
    });

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('owner', 'firstName lastName email profileImage')
      .populate('members.user', 'firstName lastName email profileImage');

    res.json(populatedGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/groups
// @desc    Get user's groups
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user': req.user.id
    })
    .populate('owner', 'firstName lastName email profileImage')
    .populate('members.user', 'firstName lastName email profileImage')
    .sort('-updatedAt');

    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 