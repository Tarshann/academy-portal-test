const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const PushNotificationService = require('../services/pushNotifications');
const User = require('../models/User');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get notifications
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'firstName lastName email profileImage')
      .populate('group', 'name');
    
    // Get count
    const total = await Notification.countDocuments({ recipient: req.user.id });
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user.id,
      isRead: false
    });
    
    res.json({
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if notification belongs to user
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Mark as read
    notification.isRead = true;
    notification.readAt = Date.now();
    await notification.save();
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true, readAt: Date.now() }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }
    
    // Check if user is recipient
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification',
      });
    }
    
    // Delete notification
    await notification.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {},
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/read
// @access  Private
router.delete('/read', protect, async (req, res) => {
  try {
    // Delete all read notifications for the user
    const result = await Notification.deleteMany({
      recipient: req.user.id,
      isRead: true,
    });
    
    res.status(200).json({
      success: true,
      count: result.deletedCount,
      message: `Deleted ${result.deletedCount} read notifications`,
    });
  } catch (error) {
    console.error('Delete read notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread/count
// @access  Private
router.get('/unread/count', protect, async (req, res) => {
  try {
    // Count unread notifications
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });
    
    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('Get unread notification count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   POST /api/notifications/push-token
// @desc    Save or update push notification token
// @access  Private
router.post('/push-token', protect, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    // Update user's push token
    await User.findByIdAndUpdate(req.user.id, {
      pushToken: token
    });
    
    res.json({ message: 'Push token updated' });
  } catch (error) {
    console.error('Error updating push token:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notifications/test
// @desc    Send a test notification
// @access  Private
router.post('/test', protect, async (req, res) => {
  try {
    // Get user
    const user = await User.findById(req.user.id);
    
    if (!user.pushToken) {
      return res.status(400).json({ message: 'No push token found' });
    }
    
    // Send test notification
    const result = await PushNotificationService.sendPushNotification(
      user.pushToken,
      {
        title: 'Test Notification',
        body: 'This is a test notification',
        data: {
          type: 'test',
          timestamp: Date.now()
        }
      }
    );
    
    res.json({ message: 'Test notification sent', result });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 