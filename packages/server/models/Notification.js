const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'message',
        'group_invitation',
        'group_join',
        'group_leave',
        'role_change',
        'system',
        'announcement'
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    link: {
      type: String,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying notifications by recipient
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, read: 1 });

// Mark notification as read
NotificationSchema.methods.markAsRead = async function () {
  this.read = true;
  this.readAt = Date.now();
  return this.save();
};

// Create a system notification
NotificationSchema.statics.createSystemNotification = async function (recipientId, title, content, options = {}) {
  return this.create({
    recipient: recipientId,
    type: 'system',
    title,
    content,
    priority: options.priority || 'normal',
    link: options.link,
    expiresAt: options.expiresAt,
    metadata: options.metadata || {},
  });
};

// Create a message notification
NotificationSchema.statics.createMessageNotification = async function (recipientId, senderId, groupId, messageId, content) {
  return this.create({
    recipient: recipientId,
    sender: senderId,
    type: 'message',
    title: 'New Message',
    content: content.length > 50 ? content.substring(0, 50) + '...' : content,
    group: groupId,
    message: messageId,
    link: `/groups/${groupId}?message=${messageId}`,
    metadata: {
      messageId: messageId.toString(),
      groupId: groupId.toString(),
    },
  });
};

// Create a group invitation notification
NotificationSchema.statics.createGroupInvitationNotification = async function (recipientId, senderId, groupId, groupName) {
  return this.create({
    recipient: recipientId,
    sender: senderId,
    type: 'group_invitation',
    title: 'Group Invitation',
    content: `You have been invited to join the group: ${groupName}`,
    group: groupId,
    link: `/groups/${groupId}`,
    metadata: {
      groupId: groupId.toString(),
      groupName,
    },
    priority: 'high',
  });
};

// Get unread notification count for a user
NotificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({
    recipient: userId,
    read: false,
  });
};

module.exports = mongoose.model('Notification', NotificationSchema); 