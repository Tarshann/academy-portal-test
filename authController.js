// Authentication controller for handling user registration, login, and password reset
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const sendEmail = require('../utils/email');

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// Send token response
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  // Set cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };
  
  // Remove password from output
  user.password = undefined;
  
  // Send response with cookie
  res.status(statusCode)
    .cookie('jwt', token, cookieOptions)
    .json({
      status: 'success',
      token,
      data: {
        user
      }
    });
};

// Register new user
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, passwordConfirm, role } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email already in use'
      });
    }
    
    // Create new user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'parent' // Default to parent if no role specified
    });
    
    // Generate verification token
    const verificationToken = newUser.createEmailVerificationToken();
    await newUser.save({ validateBeforeSave: false });
    
    // Create verification URL
    const verificationURL = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;
    
    // Send verification email
    try {
      await sendEmail({
        email: newUser.email,
        subject: 'The Academy Portal - Verify Your Email',
        message: `Welcome to The Academy Portal! Please verify your email by clicking on the following link: ${verificationURL}\nIf you didn't create this account, please ignore this email.`
      });
      
      createSendToken(newUser, 201, res);
    } catch (err) {
      // If email sending fails, reset verification token and expiry
      newUser.emailVerificationToken = undefined;
      newUser.emailVerificationExpires = undefined;
      await newUser.save({ validateBeforeSave: false });
      
      return res.status(500).json({
        status: 'error',
        message: 'Error sending verification email. Please try again later.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
    }
    
    // Find user by email and include password field
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }
    
    // Update last login timestamp
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    
    // Send token
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Logout user
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({ status: 'success' });
};

// Protect routes - middleware to check if user is logged in
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from authorization header or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    
    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to get access.'
      });
    }
    
    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.'
      });
    }
    
    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid token. Please log in again.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Your token has expired. Please log in again.'
      });
    }
    next(error);
  }
};

// Restrict to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    // Get user based on email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'There is no user with that email address.'
      });
    }
    
    // Generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    
    // Create reset URL
    const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    
    // Send reset email
    try {
      await sendEmail({
        email: user.email,
        subject: 'The Academy Portal - Password Reset',
        message: `Forgot your password? Submit a request with your new password to: ${resetURL}\nIf you didn't forget your password, please ignore this email.`
      });
      
      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
      });
    } catch (err) {
      // If email sending fails, reset token and expiry
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({
        status: 'error',
        message: 'Error sending email. Please try again later.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    // Get user based on token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    // If token has not expired, and there is a user, set the new password
    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token is invalid or has expired'
      });
    }
    
    // Update password and clear reset token fields
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    // Log the user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Verify email
exports.verifyEmail = async (req, res, next) => {
  try {
    // Get user based on token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });
    
    // If token has not expired, and there is a user, verify email
    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token is invalid or has expired'
      });
    }
    
    // Update user to verified and clear verification token fields
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    // Redirect to login page with success message
    res.redirect('/login?verified=true');
  } catch (error) {
    next(error);
  }
};

// Update password for logged in user
exports.updatePassword = async (req, res, next) => {
  try {
    // Get user from collection
    const user = await User.findById(req.user.id).select('+password');
    
    // Check if current password is correct
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Your current password is incorrect'
      });
    }
    
    // Update password
    user.password = req.body.newPassword;
    await user.save();
    
    // Log user in with new password, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Google OAuth login
exports.googleLogin = async (req, res, next) => {
  try {
    const { googleId, email, firstName, lastName, profilePicture } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      // Update Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // Create new user
      user = await User.create({
        firstName,
        lastName,
        email,
        googleId,
        profilePicture,
        isEmailVerified: true // Google accounts are already verified
      });
    }
    
    // Update last login timestamp
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    
    // Send token
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Facebook OAuth login
exports.facebookLogin = async (req, res, next) => {
  try {
    const { facebookId, email, firstName, lastName, profilePicture } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      // Update Facebook ID if not already set
      if (!user.facebookId) {
        user.facebookId = facebookId;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // Create new user
      user = await User.create({
        firstName,
        lastName,
        email,
        facebookId,
        profilePicture,
        isEmailVerified: true // Facebook accounts are already verified
      });
    }
    
    // Update last login timestamp
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    
    // Send token
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};
