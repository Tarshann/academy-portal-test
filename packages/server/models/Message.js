const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    attachments: [
      {
        type: {
          type: String,
          enum: ['image', 'file', 'video', 'audio'],
        },
        url: String,
        name: String,
        size: Number,
        mimetype: String,
      },
    ],
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editHistory: [
      {
        content: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying messages by group
MessageSchema.index({ group: 1, createdAt: -1 });

// Mark message as read by a user
MessageSchema.methods.markAsRead = async function (userId) {
  if (!this.readBy.some(reader => reader.user.toString() === userId.toString())) {
    this.readBy.push({
      user: userId,
      readAt: Date.now(),
    });
    await this.save();
  }
  return this;
};

// Edit message
MessageSchema.methods.editContent = async function (newContent) {
  // Save previous content to history
  this.editHistory.push({
    content: this.content,
    editedAt: Date.now(),
  });
  
  // Update content
  this.content = newContent;
  this.isEdited = true;
  
  return this.save();
};

// Soft delete message
MessageSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  return this.save();
};

// Get unread messages for a user in a group
MessageSchema.statics.getUnreadCount = async function (groupId, userId) {
  return this.countDocuments({
    group: groupId,
    'readBy.user': { $ne: userId },
    sender: { $ne: userId },
    isDeleted: false,
  });
};

module.exports = mongoose.model('Message', MessageSchema); 