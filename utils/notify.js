// utils/notify.js
/**
 * Notification utility for The Academy Portal
 * Handles sending notifications to users through various channels
 */

// Get Socket.IO instance from global
const io = global.io;

/**
 * Send a notification to one or more users
 * @param {string} type - Notification type (e.g., 'message', 'system', 'alert')
 * @param {string|Array} userId - ID of user(s) to notify
 * @param {string} message - Notification message
 * @param {Object} data - Additional data for the notification
 */
const notify = (type, userId, message, data = {}) => {
  // Log the notification
  console.log(`📢 Notification: [${type}] ${message} for user(s) ${userId}`);
  
  // If Socket.IO is available, emit the notification
  if (io) {
    if (Array.isArray(userId)) {
      // Send to multiple users
      userId.forEach(id => {
        io.to(`user:${id}`).emit('notification', {
          type,
          message,
          data,
          timestamp: Date.now()
        });
      });
    } else {
      // Send to a single user
      io.to(`user:${userId}`).emit('notification', {
        type,
        message,
        data,
        timestamp: Date.now()
      });
    }
  }
  
  // In a real implementation, you might also:
  // 1. Store the notification in the database
  // 2. Send an email if the user has email notifications enabled
  // 3. Send a push notification if the user has a registered device
};

module.exports = notify;
