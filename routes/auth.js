// routes/auth.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // your user model
const sendEmail = require('../utils/sendEmail'); // stubbed mail sender

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

    // Simulated email verification
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });

    if (!user.isVerified) return res.status(401).json({ msg: 'Please verify your email first' });

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
          role: user.role
        }
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  check('email', 'Please include a valid email').isEmail()
], async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30m' });
    await sendEmail(email, 'Password Reset', `Reset link: /reset-password/${resetToken}`);

    res.json({ msg: 'Reset instructions sent' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.post('/reset-password/:token', [
  check('password', 'Password must be at least 8 characters').isLength({ min: 8 })
], async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hash(password, salt);

    await User.findByIdAndUpdate(decoded.id, { password: newPassword });

    res.json({ msg: 'Password reset successful' });
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ msg: 'Invalid or expired token' });
  }
});

module.exports = router;
