// models/Conversation.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConversationSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  conversationType: {
    type: String,
    enum: ['team', 'topic', 'direct'],
    required: true
  },
  description: {
    type: String
  },
  team: {
    type: Schema.Types.ObjectId,
    ref: 'Team'
  },
  participants: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      isAdmin: {
        type: Boolean,
        default: false
      },
      isMuted: {
        type: Boolean,
        default: false
      },
      joinedAt: {
        type: Date,
        default: Date.now
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }
  ],
  permissions: {
    canSendMessages: {
      type: String,
      enum: ['all', 'admins', 'specific'],
      default: 'all'
    },
    canAddParticipants: {
      type: String,
      enum: ['all', 'admins'],
      default: 'admins'
    },
    canRemoveParticipants: {
      type: String,
      enum: ['all', 'admins'],
      default: 'admins'
    },
    canChangeSettings: {
      type: String,
      enum: ['all', 'admins'],
      default: 'admins'
    }
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date
  }
});

// Index for faster queries
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ conversationType: 1 });
ConversationSchema.index({ isArchived: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
