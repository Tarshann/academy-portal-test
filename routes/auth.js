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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      isVerified: false
    });

    await user.save();

    const verifyToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    await sendEmail(email, 'Verify Your Email', `Click to verify: /verify/${verifyToken}`);

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
  const errors = validationResult
