// routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { check, validationResult } = require('express-validator');

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private (admin only)
router.get('/users', auth, role(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/users/pending
// @desc    Get pending users
// @access  Private (admin only)
router.get('/users/pending', auth, role(['admin']), async (req, res) => {
  try {
    const users = await User.find({ approvalStatus: 'pending' }).select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/admin/users/:id/approve
// @desc    Approve user
// @access  Private (admin only)
router.put('/users/:id/approve', auth, role(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update approval status and account status
    user.approvalStatus = 'approved';
    user.accountStatus = 'active';
    
    await user.save();
    
    // TODO: Send notification to user about approval
    
    res.json({ msg: 'User approved successfully', user });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.status(500).send('Server error');
  }
});

// @route   PUT api/admin/users/:id/reject
// @desc    Reject user
// @access  Private (admin only)
router.put('/users/:id/reject', auth, role(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update approval status
    user.approvalStatus = 'rejected';
    
    await user.save();
    
    // TODO: Send notification to user about rejection
    
    res.json({ msg: 'User rejected successfully', user });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.status(500).send('Server error');
  }
});

// @route   PUT api/admin/users/:id/update-role
// @desc    Update user role
// @access  Private (admin only)
router.put('/users/:id/update-role', [
  auth, 
  role(['admin']), 
  check('role', 'Role is required').not().isEmpty()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { role } = req.body;

  // Validate role
  const validRoles = ['admin', 'coach', 'parent', 'player'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ 
      errors: [{ msg: 'Invalid role' }] 
    });
  }

  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update role
    user.role = role;
    
    await user.save();
    
    res.json({ msg: 'User role updated successfully', user });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.status(500).send('Server error');
  }
});

// @route   PUT api/admin/users/:id/update-status
// @desc    Update user account status
// @access  Private (admin only)
router.put('/users/:id/update-status', [
  auth, 
  role(['admin']), 
  check('accountStatus', 'Account status is required').not().isEmpty()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { accountStatus } = req.body;

  // Validate status
  const validStatuses = ['active', 'inactive', 'suspended'];
  if (!validStatuses.includes(accountStatus)) {
    return res.status(400).json({ 
      errors: [{ msg: 'Invalid account status' }] 
    });
  }

  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update account status
    user.accountStatus = accountStatus;
    
    await user.save();
    
    res.json({ msg: 'User account status updated successfully', user });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.status(500).send('Server error');
  }
});

module.exports = router;
