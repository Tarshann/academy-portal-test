const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  check('firstName', 'First name is required').notEmpty(),
  check('lastName', 'Last name is required').notEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
  check('phoneNumber', 'Phone number is required').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { firstName, lastName, email, password, phoneNumber } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ errors: [{ msg: 'User already exists' }] });

    user = new User({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      isEmailVerified: false
    });

    const verificationToken = user.createEmailVerificationToken();
    await user.save();

    await sendEmail(email, 'Verify Your Email', `Click to verify: /verify/${verificationToken}`);

    res.status(201).json({ msg: 'Registration successful. Check your email to verify.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user
// @access  Public
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });

    const isMatch = await user.correctPassword(password, user.password);
    if (!isMatch) return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });

    if (!user.isEmailVerified) return res.status(401).json({ msg: 'Please verify your email first' });

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;

      res.json({
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          profileImage: user.profileImage,
          notificationPreferences: user.notificationPreferences
        }
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
