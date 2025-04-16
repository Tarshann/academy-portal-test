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
      enum: ['message', 'group_invite', 'group_join', 'group_leave', 'system'],
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
    link: {
      type: String,
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

// Index for faster queries on user's notifications
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

// Mark notification as read
NotificationSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return this;
};

// Create a system notification
NotificationSchema.statics.createSystemNotification = async function (recipientId, title, content, options = {}) {
  return this.create({
    recipient: recipientId,
    type: 'system',
    title,
    body: content,
    priority: options.priority || 'normal',
    link: options.link,
    expiresAt: options.expiresAt,
    metadata: options.metadata || {},
  });
};

// Create a message notification
NotificationSchema.statics.createMessageNotification = async function (recipientId, senderId, groupId, messageId, messageContent) {
  const sender = await mongoose.model('User').findById(senderId);
  
  if (!sender) {
    throw new Error('Sender not found');
  }
  
  const trimmedContent = messageContent.length > 50 
    ? `${messageContent.substring(0, 50)}...` 
    : messageContent;
  
  return this.create({
    recipient: recipientId,
    sender: senderId,
    type: 'message',
    group: groupId,
    message: messageId,
    title: `New message from ${sender.firstName} ${sender.lastName}`,
    body: trimmedContent,
    metadata: {
      senderName: `${sender.firstName} ${sender.lastName}`,
      messageId: messageId.toString(),
      groupId: groupId.toString()
    }
  });
};

// Create a group invitation notification
NotificationSchema.statics.createGroupInvitationNotification = async function (recipientId, senderId, groupId, groupName) {
  return this.create({
    recipient: recipientId,
    sender: senderId,
    type: 'group_invite',
    title: 'Group Invitation',
    body: `You have been invited to join the group: ${groupName}`,
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
    isRead: false,
  });
};

module.exports = mongoose.model('Notification', NotificationSchema); 