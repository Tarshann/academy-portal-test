// routes/profile.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = 'uploads/profile-images';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB max file size
  },
  fileFilter: fileFilter
});

// @route   GET api/profile
// @desc    Get current user profile
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Find user by id (exclude password)
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/profile
// @desc    Update user profile
// @access  Private
router.put('/', [
  auth,
  check('name', 'Name is required').not().isEmpty(),
  check('phoneNumber', 'Phone number is required').not().isEmpty()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    phoneNumber,
    childName,
    address,
    shirtSize
  } = req.body;

  try {
    // Find user by id
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update profile fields
    user.name = name;
    user.phoneNumber = phoneNumber;
    user.childName = childName;
    user.address = address;
    user.shirtSize = shirtSize;
    user.updatedAt = Date.now();
    
    await user.save();
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/profile/notification-settings
// @desc    Update notification settings
// @access  Private
router.put('/notification-settings', auth, async (req, res) => {
  const { email, push, sms } = req.body;

  try {
    // Find user by id
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update notification settings
    user.notificationSettings = {
      email: email !== undefined ? email : user.notificationSettings.email,
      push: push !== undefined ? push : user.notificationSettings.push,
      sms: sms !== undefined ? sms : user.notificationSettings.sms
    };
    
    user.updatedAt = Date.now();
    
    await user.save();
    
    res.json(user.notificationSettings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/profile/password
// @desc    Update password
// @access  Private
router.put('/password', [
  auth,
  check('currentPassword', 'Current password is required').exists(),
  check('newPassword', 'Password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    // Find user by id
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ 
        errors: [{ msg: 'Current password is incorrect' }] 
      });
    }
    
    // Update password
    user.password = newPassword;
    user.updatedAt = Date.now();
    
    await user.save();
    
    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/profile/upload-image
// @desc    Upload profile image
// @access  Private
router.post('/upload-image', auth, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    // Find user by id
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Delete old profile image if it exists and is not the default
    if (user.profileImage && 
        user.profileImage !== '/images/default-avatar.png' &&
        fs.existsSync(`.${user.profileImage}`)) {
      fs.unlinkSync(`.${user.profileImage}`);
    }
    
    // Update profile image path
    const imagePath = `/uploads/profile-images/${req.file.filename}`;
    user.profileImage = imagePath;
    user.updatedAt = Date.now();
    
    await user.save();
    
    res.json({ 
      msg: 'Profile image uploaded successfully',
      profileImage: imagePath
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
