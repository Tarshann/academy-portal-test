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
      trim: true,
    },
    attachments: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['image', 'document', 'video', 'audio'],
          default: 'image',
        },
        name: {
          type: String,
          default: '',
        },
        size: {
          type: Number,
          default: 0,
        },
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
    editNavigate: [
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

// Mark message as read by a specific user
MessageSchema.methods.markAsRead = async function (userId) {
  // Check if already read by this user
  const isRead = this.readBy.some(
    read => read.user.toString() === userId.toString()
  );
  
  if (!isRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date(),
    });
    
    return this.save();
  }
  
  return this;
};

// Edit message
MessageSchema.methods.editContent = async function (newContent) {
  // Save previous content to navigate
  this.editNavigate.push({
    content: this.content,
    editedAt: Date.now(),
  });
  
  // Update content
  this.content = newContent;
  this.isEdited = true;
  
  return this.save();
};

// Mark message as deleted
MessageSchema.methods.markAsDeleted = async function () {
  this.isDeleted = true;
  return this.save();
};

// Static method to get unread messages count for a user in a group
MessageSchema.statics.getUnreadCount = async function (userId, groupId) {
  return this.countDocuments({
    group: groupId,
    sender: { $ne: userId },
    'readBy.user': { $ne: userId },
    isDeleted: false,
  });
};

module.exports = mongoose.model('Message', MessageSchema); 
