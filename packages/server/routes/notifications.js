const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, read } = req.query;
    
    // Build query
    const query = { recipient: req.user.id };
    
    // Filter by read status if provided
    if (read === 'true') query.read = true;
    if (read === 'false') query.read = false;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'sender',
        select: 'firstName lastName email profileImage',
      })
      .populate({
        path: 'group',
        select: 'name type image',
      });
    
    // Count total notifications
    const total = await Notification.countDocuments(query);
    
    // Calculate unread count
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      read: false,
    });
    
    // Pagination info
    const pagination = {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    };
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      pagination,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
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
        message: 'Not authorized to update this notification',
      });
    }
    
    // Mark as read
    await notification.markAsRead();
    
    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    // Update all unread notifications for the user
    const result = await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true, readAt: Date.now() }
    );
    
    res.status(200).json({
      success: true,
      count: result.modifiedCount,
      message: `Marked ${result.modifiedCount} notifications as read`,
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
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
      read: true,
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
      read: false,
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

module.exports = router; 