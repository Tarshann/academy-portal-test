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
