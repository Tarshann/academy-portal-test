const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration and verification
router.post('/register', authController.register);
router.get('/verify-email/:token', authController.verifyEmail);

// Login and logout
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Password management
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.patch('/update-password', authController.protect, authController.updatePassword);

// Social login
router.post('/google-login', authController.googleLogin);
router.post('/facebook-login', authController.facebookLogin);

// Protected route example
router.get('/me', authController.protect, (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

// Admin only route example
router.get('/admin-dashboard', 
  authController.protect, 
  authController.restrictTo('admin'), 
  (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Welcome to admin dashboard'
    });
  }
);

module.exports = router;
