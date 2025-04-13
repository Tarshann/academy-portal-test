// routes/message.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for media uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = 'uploads/message-media';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and common file types
  const allowedFileTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf', 
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PowerPoint
    'text/plain'
  ];
  
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10 // 10MB max file size
  },
  fileFilter: fileFilter
});

// Helper function to extract mentions from message content
const extractMentions = async (content) => {
  const mentionPattern = /@([a-fA-F0-9]{24})/g;
  const matches = content.match(mentionPattern) || [];
  
  return matches.map(match => match.substring(1)); // Remove @ symbol
};

// @route   GET api/conversations/:conversationId/messages
// @desc    Get messages for a conversation
// @access  Private
router.get('/:conversationId/messages', auth, async (req, res) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.conversationId)) {
      return res.status(400).json({ msg: 'Invalid conversation ID' });
    }
    
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }
    
    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      p => p.user.toString() === req.user.id && p.isActive
    );
    
    if (!isParticipant) {
      return res.status(403).json({ msg: 'Not authorized to access this conversation' });
    }
    
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get messages
    const messages = await Message.find({ conversation: req.params.conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name email profileImage')
      .populate('readBy', 'name email')
      .populate('reactions.user', 'name profileImage');
    
    // Get total count for pagination
    const totalMessages = await Message.countDocuments({ 
      conversation: req.params.conversationId 
    });
    
    // Mark messages as read
    const messagesToMark = messages.filter(msg => 
      !msg.readBy.some(user => user._id.toString() === req.user.id)
    );
    
    if (messagesToMark.length > 0) {
      await Promise.all(messagesToMark.map(msg => {
        msg.readBy.push(req.user.id);
        return msg.save();
      }));
    }
    
    res.json({
      messages: messages.reverse(), // Reverse to get oldest first
      pagination: {
        page,
        limit,
        totalMessages,
        totalPages: Math.ceil(totalMessages / limit)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/conversations/:conversationId/messages
// @desc    Send a text message
// @access  Private
router.post('/:conversationId/messages', [
  auth,
  check('content', 'Message content is required').not().isEmpty()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { content } = req.body;

  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.conversationId)) {
      return res.status(400).json({ msg: 'Invalid conversation ID' });
    }
    
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }
    
    // Check if user is a participant
    const participantData = conversation.participants.find(
      p => p.user.toString() === req.user.id && p.isActive
    );
    
    if (!participantData) {
      return res.status(403).json({ msg: 'Not authorized to access this conversation' });
    }
    
    // Check if user is muted
    if (participantData.isMuted) {
      return res.status(403).json({ msg: 'You are muted in this conversation' });
    }
    
    // Check if user has permission to send messages
    const canSendMessages = 
      conversation.permissions.canSendMessages === 'all' || 
      (conversation.permissions.canSendMessages === 'admins' && participantData.isAdmin) ||
      req.user.role === 'admin';
    
    if (!canSendMessages) {
      return res.status(403).json({ msg: 'Not authorized to send messages in this conversation' });
    }
    
    // Extract mentions
    const mentionedUserIds = await extractMentions(content);
    
    // Create message
    const newMessage = new Message({
      conversation: conversation._id,
      sender: req.user.id,
      content,
      messageType: 'text',
      readBy: [req.user.id],
      mentions: mentionedUserIds
    });
    
    const message = await newMessage.save();
    
    // Update conversation with lastMessage and lastMessageAt
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    conversation.updatedAt = Date.now();
    await conversation.save();
    
    // Populate message data before returning
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email profileImage')
      .populate('readBy', 'name email')
      .populate('mentions', 'name email');
    
    res.json(populatedMessage);
    
    // TODO: Send notifications to conversation participants and mentioned users
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/conversations/:conversationId/messages/media
// @desc    Send a media message
// @access  Private
router.post('/:conversationId/messages/media', [
  auth,
  upload.single('media')
], async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.conversationId)) {
      return res.status(400).json({ msg: 'Invalid conversation ID' });
    }
    
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }
    
    // Check if user is a participant
    const participantData = conversation.participants.find(
      p => p.user.toString() === req.user.id && p.isActive
    );
    
    if (!participantData) {
      return res.status(403).json({ msg: 'Not authorized to access this conversation' });
    }
    
    // Check if user is muted
    if (participantData.isMuted) {
      return res.status(403).json({ msg: 'You are muted in this conversation' });
    }
    
    // Check if user has permission to send messages
    const canSendMessages = 
      conversation.permissions.canSendMessages === 'all' || 
      (conversation.permissions.canSendMessages === 'admins' && participantData.isAdmin) ||
      req.user.role === 'admin';
    
    if (!canSendMessages) {
      return res.status(403).json({ msg: 'Not authorized to send messages in this conversation' });
    }
    
    // Determine message type based on file mimetype
    const messageType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
    
    // Get content from request body (optional caption)
    const content = req.body.content || '';
    
    // Extract mentions
    const mentionedUserIds = await extractMentions(content);
    
    // Create message
    const newMessage = new Message({
      conversation: conversation._id,
      sender: req.user.id,
      content,
      messageType,
      mediaUrl: `/uploads/message-media/${req.file.filename}`,
      mediaName: req.file.originalname,
      mediaSize: req.file.size,
      readBy: [req.user.id],
      mentions: mentionedUserIds
    });
    
    const message = await newMessage.save();
    
    // Update conversation with lastMessage and lastMessageAt
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    conversation.updatedAt = Date.now();
    await conversation.save();
    
    // Populate message data before returning
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email profileImage')
      .populate('readBy', 'name email')
      .populate('mentions', 'name email');
    
    res.json(populatedMessage);
    
    // TODO: Send notifications to conversation participants and mentioned users
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/conversations/:conversationId/messages/:messageId
// @desc    Edit a message
// @access  Private
router.put('/:conversationId/messages/:messageId', [
  auth,
  check('content', 'Message content is required').not().isEmpty()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { content } = req.body;

  try {
    // Validate MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(req.params.conversationId) ||
        !mongoose.Types.ObjectId.isValid(req.params.messageId)) {
      return res.status(400).json({ msg: 'Invalid ID' });
    }
    
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }
    
    // Verify message belongs to the specified conversation
    if (message.conversation.toString() !== req.params.conversationId) {
      return res.status(400).json({ msg: 'Message not found in this conversation' });
    }
    
    // Check if user is the sender of the message
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to edit this message' });
    }
    
    // Only text messages can be edited
    if (message.messageType !== 'text') {
      return res.status(400).json({ msg: 'Only text messages can be edited' });
    }
    
    // Extract mentions
    const mentionedUserIds = await extractMentions(content);
    
    // Update message
    message.content = content;
    message.isEdited = true;
    message.updatedAt = Date.now();
    message.mentions = mentionedUserIds;
    
    await message.save();
    
    // Populate message data before returning
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email profileImage')
      .populate('readBy', 'name email')
      .populate('mentions', 'name email');
    
    res.json(populatedMessage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/conversations/:conversationId/messages/:messageId
// @desc    Delete a message
// @access  Private
router.delete('/:conversationId/messages/:messageId', auth, async (req, res) => {
  try {
    // Validate MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(req.params.conversationId) ||
        !mongoose.Types.ObjectId.isValid(req.params.messageId)) {
      return res.status(400).json({ msg: 'Invalid ID' });
    }
    
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }
    
    // Verify message belongs to the specified conversation
    if (message.conversation.toString() !== req.params.conversationId) {
      return res.status(400).json({ msg: 'Message not found in this conversation' });
    }
    
    // Check if user is the sender of the message or admin
    const isSender = message.sender.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isSender && !isAdmin) {
      return res.status(403).json({ msg: 'Not authorized to delete this message' });
    }
    
    // Delete message
    await message.remove();
    
    // If this was the last message in the conversation, update lastMessage
    const conversation = await Conversation.findById(req.params.conversationId);
    if (conversation.lastMessage && conversation.lastMessage.toString() === req.params.messageId) {
      // Find the new last message
      const lastMessage = await Message.find({ conversation: req.params.conversationId })
        .sort({ createdAt: -1 })
        .limit(1);
      
      if (lastMessage.length > 0) {
        conversation.lastMessage = lastMessage[0]._id;
        conversation.lastMessageAt = lastMessage[0].createdAt;
      } else {
        conversation.lastMessage = null;
        conversation.lastMessageAt = null;
      }
      
      await conversation.save();
    }
    
    res.json({ msg: 'Message deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/conversations/:conversationId/messages/:messageId/reaction
// @desc    Add a reaction to a message
// @access  Private
router.post('/:conversationId/messages/:messageId/reaction', [
  auth,
  check('reaction', 'Reaction is required').not().isEmpty()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { reaction } = req.body;

  try {
    // Validate MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(req.params.conversationId) ||
        !mongoose.Types.ObjectId.isValid(req.params.messageId)) {
      return res.status(400).json({ msg: 'Invalid ID' });
    }
    
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }
    
    // Verify message belongs to the specified conversation
    if (message.conversation.toString() !== req.params.conversationId) {
      return res.status(400).json({ msg: 'Message not found in this conversation' });
    }
    
    // Check if user is a participant in the conversation
    const conversation = await Conversation.findById(req.params.conversationId);
    const isParticipant = conversation.participants.some(
      p => p.user.toString() === req.user.id && p.isActive
    );
    
    if (!isParticipant) {
      return res.status(403).json({ msg: 'Not authorized to access this conversation' });
    }
    
    // Check if user already reacted with this emoji
    const existingReactionIndex = message.reactions.findIndex(
      r => r.user.toString() === req.user.id && r.reaction === reaction
    );
    
    if (existingReactionIndex !== -1) {
      // Remove existing reaction
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Remove any existing reaction by this user (one reaction per user)
      const userReactionIndex = message.reactions.findIndex(
        r => r.user.toString() === req.user.id
      );
      
      if (userReactionIndex !== -1) {
        message.reactions.splice(userReactionIndex, 1);
      }
      
      // Add new reaction
      message.reactions.push({
        user: req.user.id,
        reaction,
        createdAt: Date.now()
      });
    }
    
    message.updatedAt = Date.now();
    
    await message.save();
    
    // Populate message data before returning
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email profileImage')
      .populate('readBy', 'name email')
      .populate('reactions.user', 'name profileImage');
    
    res.json(populatedMessage);
    
    // TODO: Send notification to message sender if someone else reacted
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
