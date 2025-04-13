// models/Message.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  mediaUrl: {
    type: String
  },
  mediaName: {
    type: String
  },
  mediaSize: {
    type: Number
  },
  reactions: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      reaction: {
        type: String
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  readBy: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  isEdited: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  mentions: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
});

// Create indexes for faster queries
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', MessageSchema);
