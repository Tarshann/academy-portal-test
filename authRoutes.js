// Authentication routes
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration and login routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Password management routes
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.patch('/update-password', authController.protect, authController.updatePassword);

// Email verification route
router.get('/verify-email/:token', authController.verifyEmail);

// Social login routes
router.post('/google', authController.googleLogin);
router.post('/facebook', authController.facebookLogin);

module.exports = router;
