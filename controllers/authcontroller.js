const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const sendEmail = require('../utils/email');

// Create JWT token
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Send JWT via cookie
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  };
  
  res.cookie('jwt', token, cookieOptions);
  
  // Remove password from output
  user.password = undefined;
  
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, passwordConfirm, role } = req.body;
    
    // Check if passwords match
    if (password !== passwordConfirm) {
      return res.status(400).json({
        status: 'fail',
        message: 'Passwords do not match'
      });
    }
    
    // Check if user already exists
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
    
    // Generate email verification token
    const verificationToken = newUser.createEmailVerificationToken();
    await newUser.save({ validateBeforeSave: false });
    
    // Create verification URL
    const verificationURL = `${req.protocol}://${req.get(
      'host'
    )}/verify-email/${verificationToken}`;
    
    const message = `Welcome to The Academy Basketball Program! Please verify your email by clicking the link below:\n\n${verificationURL}\n\nIf you didn't register for an account, please ignore this email.`;
    
    // Send verification email
    try {
      await sendEmail({
        email: newUser.email,
        subject: 'Email Verification - The Academy Basketball Program',
        message
      });
      
      createSendToken(newUser, 201, req, res);
    } catch (err) {
      newUser.emailVerificationToken = undefined;
      newUser.emailVerificationExpires = undefined;
      await newUser.save({ validateBeforeSave: false });
      
      return res.status(500).json({
        status: 'error',
        message: 'Error sending verification email. Please try again later.'
      });
    }
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    // Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });
    
    // If token has expired or is invalid
    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token is invalid or has expired'
      });
    }
    
    // Activate account
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    // Redirect to login page
    res.redirect('/login?verified=true');
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred. Please try again later.'
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
    }
    
    // Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }
    
    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        status: 'fail',
        message: 'Please verify your email before logging in'
      });
    }
    
    // Update last login time
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    
    // Send token to client
    createSendToken(user, 200, req, res);
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
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

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    // Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'There is no user with that email address'
      });
    }
    
    // Generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    
    // Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/reset-password/${resetToken}`;
    
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid for 10 min)',
        message
      });
      
      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({
        status: 'error',
        message: 'There was an error sending the email. Try again later!'
      });
    }
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    // Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    // If token has not expired, and there is user, set the new password
    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token is invalid or has expired'
      });
    }
    
    // Update password
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    // Log the user in, send JWT
    createSendToken(user, 200, req, res);
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    // Get user from collection
    const user = await User.findById(req.user.id).select('+password');
    
    // Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Your current password is wrong'
      });
    }
    
    // If so, update password
    user.password = req.body.newPassword;
    await user.save();
    
    // Log user in, send JWT
    createSendToken(user, 200, req, res);
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Protect routes - middleware to check if user is logged in
exports.protect = async (req, res, next) => {
  try {
    // Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    
    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.'
      });
    }
    
    // Verification token
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
    res.locals.user = currentUser;
    next();
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: 'Not authorized to access this route'
    });
  }
};

// Restrict to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'coach']
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
};

// Google OAuth login
exports.googleLogin = async (req, res) => {
  try {
    const { id, email, name, token } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ 'socialProfiles.google.id': id });
    
    if (!user) {
      // Check if user exists with this email
      user = await User.findOne({ email });
      
      if (user) {
        // Link Google account to existing user
        user.socialProfiles.google = {
          id,
          email,
          name,
          token
        };
        await user.save({ validateBeforeSave: false });
      } else {
        // Create new user
        const nameParts = name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        
        user = await User.create({
          firstName,
          lastName,
          email,
          password: crypto.randomBytes(16).toString('hex'),
          isEmailVerified: true,
          socialProfiles: {
            google: {
              id,
              email,
              name,
              token
            }
          }
        });
      }
    }
    
    // Update last login time
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    
    // Send token to client
    createSendToken(user, 200, req, res);
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Facebook OAuth login
exports.facebookLogin = async (req, res) => {
  try {
    const { id, email, name, token } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ 'socialProfiles.facebook.id': id });
    
    if (!user) {
      // Check if user exists with this email
      user = await User.findOne({ email });
      
      if (user) {
        // Link Facebook account to existing user
        user.socialProfiles.facebook = {
          id,
          email,
          name,
          token
        };
        await user.save({ validateBeforeSave: false });
      } else {
        // Create new user
        const nameParts = name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        
        user = await User.create({
          firstName,
          lastName,
          email,
          password: crypto.randomBytes(16).toString('hex'),
          isEmailVerified: true,
          socialProfiles: {
            facebook: {
              id,
              email,
              name,
              token
            }
          }
        });
      }
    }
    
    // Update last login time
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    
    // Send token to client
    createSendToken(user, 200, req, res);
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};
