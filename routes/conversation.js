// routes/conversation.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { check, validationResult } = require('express-validator');

// @route   GET api/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      'participants.user': req.user.id,
      'participants.isActive': true
    })
    .populate('participants.user', 'name email profileImage')
    .populate('createdBy', 'name')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });
    
    res.json(conversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/conversations
// @desc    Create a new conversation
// @access  Private
router.post('/', [
  auth,
  check('name', 'Name is required').not().isEmpty(),
  check('conversationType', 'Conversation type is required').isIn(['team', 'topic', 'direct']),
  check('participants', 'Participants are required').isArray({ min: 1 })
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    conversationType,
    description,
    team,
    participants,
    permissions
  } = req.body;

  try {
    // Check if all participants are valid users
    const userIds = [...participants, req.user.id];
    const uniqueUserIds = [...new Set(userIds)]; // Remove duplicates
    
    const validUsers = await User.find({
      _id: { $in: uniqueUserIds },
      approvalStatus: 'approved',
      accountStatus: 'active'
    });
    
    if (validUsers.length !== uniqueUserIds.length) {
      return res.status(400).json({ 
        errors: [{ msg: 'One or more participants are invalid' }] 
      });
    }
    
    // Create new conversation
    const newConversation = new Conversation({
      name,
      conversationType,
      description,
      team,
      participants: uniqueUserIds.map(userId => ({
        user: userId,
        isAdmin: userId.toString() === req.user.id.toString() // Creator is admin
      })),
      permissions: permissions || {},
      createdBy: req.user.id
    });
    
    const conversation = await newConversation.save();
    
    // Create system message
    const systemMessage = new Message({
      conversation: conversation._id,
      sender: req.user.id,
      content: `${req.user.name} created this conversation`,
      messageType: 'system',
      readBy: [req.user.id]
    });
    
    await systemMessage.save();
    
    // Update conversation with lastMessage and lastMessageAt
    conversation.lastMessage = systemMessage._id;
    conversation.lastMessageAt = systemMessage.createdAt;
    await conversation.save();
    
    // Populate conversation data before returning
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants.user', 'name email profileImage')
      .populate('createdBy', 'name')
      .populate('lastMessage');
    
    res.json(populatedConversation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/conversations/:id/archive
// @desc    Archive/unarchive a conversation
// @access  Private
router.put('/:id/archive', auth, async (req, res) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid conversation ID' });
    }
    
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }
    
    // Check if user is a participant and has permission to change settings
    const participantData = conversation.participants.find(
      p => p.user.toString() === req.user.id && p.isActive
    );
    
    if (!participantData) {
      return res.status(403).json({ msg: 'Not authorized to access this conversation' });
    }
    
    const canChangeSettings = 
      conversation.permissions.canChangeSettings === 'all' || 
      (conversation.permissions.canChangeSettings === 'admins' && participantData.isAdmin) ||
      req.user.role === 'admin';
    
    if (!canChangeSettings) {
      return res.status(403).json({ msg: 'Not authorized to archive this conversation' });
    }
    
    // Toggle archive status
    conversation.isArchived = !conversation.isArchived;
    conversation.updatedAt = Date.now();
    
    await conversation.save();
    
    // Create system message for the archive action
    const action = conversation.isArchived ? 'archived' : 'unarchived';
    const systemMessage = new Message({
      conversation: conversation._id,
      sender: req.user.id,
      content: `${req.user.name} ${action} this conversation`,
      messageType: 'system',
      readBy: [req.user.id]
    });
    
    await systemMessage.save();
    
    // Update conversation with lastMessage and lastMessageAt
    conversation.lastMessage = systemMessage._id;
    conversation.lastMessageAt = systemMessage.createdAt;
    await conversation.save();
    
    // Populate conversation data before returning
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants.user', 'name email profileImage')
      .populate('createdBy', 'name')
      .populate('lastMessage');
    
    res.json(populatedConversation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/conversations/:id/participants
// @desc    Add participants to a conversation
// @access  Private
router.post('/:id/participants', [
  auth,
  check('participants', 'Participants are required').isArray({ min: 1 })
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { participants } = req.body;

  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid conversation ID' });
    }
    
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }
    
    // Check if user is a participant and has permission to add participants
    const participantData = conversation.participants.find(
      p => p.user.toString() === req.user.id && p.isActive
    );
    
    if (!participantData) {
      return res.status(403).json({ msg: 'Not authorized to access this conversation' });
    }
    
    const canAddParticipants = 
      conversation.permissions.canAddParticipants === 'all' || 
      (conversation.permissions.canAddParticipants === 'admins' && participantData.isAdmin) ||
      req.user.role === 'admin';
    
    if (!canAddParticipants) {
      return res.status(403).json({ msg: 'Not authorized to add participants to this conversation' });
    }
    
    // Check if all participants are valid users
    const validUsers = await User.find({
      _id: { $in: participants },
      approvalStatus: 'approved',
      accountStatus: 'active'
    });
    
    if (validUsers.length !== participants.length) {
      return res.status(400).json({ 
        errors: [{ msg: 'One or more participants are invalid' }] 
      });
    }
    
    // Add new participants
    const existingParticipantIds = conversation.participants.map(p => p.user.toString());
    const newParticipants = [];
    
    for (const userId of participants) {
      // If user is already a participant (active or inactive)
      const participantIndex = conversation.participants.findIndex(
        p => p.user.toString() === userId
      );
      
      if (participantIndex !== -1) {
        // If user is inactive, reactivate them
        if (!conversation.participants[participantIndex].isActive) {
          conversation.participants[participantIndex].isActive = true;
          conversation.participants[participantIndex].joinedAt = Date.now();
          newParticipants.push(userId);
        }
      } else {
        // Add new participant
        conversation.participants.push({
          user: userId,
          isAdmin: false,
          joinedAt: Date.now()
        });
        newParticipants.push(userId);
      }
    }
    
    conversation.updatedAt = Date.now();
    
    await conversation.save();
    
    // Create system message for the new participants
    if (newParticipants.length > 0) {
      const newParticipantUsers = await User.find({ _id: { $in: newParticipants } });
      const participantNames = newParticipantUsers.map(u => u.name).join(', ');
      
      const systemMessage = new Message({
        conversation: conversation._id,
        sender: req.user.id,
        content: `${req.user.name} added ${participantNames} to the conversation`,
        messageType: 'system',
        readBy: [req.user.id]
      });
      
      await systemMessage.save();
      
      // Update conversation with lastMessage and lastMessageAt
      conversation.lastMessage = systemMessage._id;
      conversation.lastMessageAt = systemMessage.createdAt;
      await conversation.save();
    }
    
    // Populate conversation data before returning
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants.user', 'name email profileImage')
      .populate('createdBy', 'name')
      .populate('lastMessage');
    
    res.json(populatedConversation);
    
    // TODO: Send notification to new participants
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/conversations/:id/participants/:userId
// @desc    Remove a participant from a conversation
// @access  Private
router.delete('/:id/participants/:userId', auth, async (req, res) => {
  try {
    // Validate MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(req.params.id) || 
        !mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ msg: 'Invalid ID' });
    }
    
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }
    
    // Check if target user is a participant
    const targetParticipantIndex = conversation.participants.findIndex(
      p => p.user.toString() === req.params.userId && p.isActive
    );
    
    if (targetParticipantIndex === -1) {
      return res.status(404).json({ msg: 'Participant not found' });
    }
    
    // Self-removal is always allowed
    const isSelfRemoval = req.params.userId === req.user.id;
    
    if (!isSelfRemoval) {
      // Check if user is a participant and has permission to remove participants
      const participantData = conversation.participants.find(
        p => p.user.toString() === req.user.id && p.isActive
      );
      
      if (!participantData) {
        return res.status(403).json({ msg: 'Not authorized to access this conversation' });
      }
      
      const canRemoveParticipants = 
        conversation.permissions.canRemoveParticipants === 'all' || 
        (conversation.permissions.canRemoveParticipants === 'admins' && participantData.isAdmin) ||
        req.user.role === 'admin';
      
      if (!canRemoveParticipants) {
        return res.status(403).json({ msg: 'Not authorized to remove participants from this conversation' });
      }
    }
    
    // Get participant name before marking inactive
    const targetUser = await User.findById(req.params.userId);
    
    if (!targetUser) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Mark participant as inactive (soft delete)
    conversation.participants[targetParticipantIndex].isActive = false;
    conversation.updatedAt = Date.now();
    
    await conversation.save();
    
    // Create system message
    const action = isSelfRemoval ? 'left' : 'was removed from';
    const systemMessage = new Message({
      conversation: conversation._id,
      sender: req.user.id,
      content: `${targetUser.name} ${action} the conversation`,
      messageType: 'system',
      readBy: [req.user.id]
    });
    
    await systemMessage.save();
    
    // Update conversation with lastMessage and lastMessageAt
    conversation.lastMessage = systemMessage._id;
    conversation.lastMessageAt = systemMessage.createdAt;
    await conversation.save();
    
    // Populate conversation data before returning
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants.user', 'name email profileImage')
      .populate('createdBy', 'name')
      .populate('lastMessage');
    
    res.json(populatedConversation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
      .populate('participants.user', 'name email profileImage')
      .populate('createdBy', 'name')
      .populate('lastMessage');
    
    res.json(populatedConversation);
    
    // TODO: Send notification to all participants
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/conversations/:id
// @desc    Get a specific conversation
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid conversation ID' });
    }
    
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants.user', 'name email profileImage')
      .populate('createdBy', 'name')
      .populate('lastMessage');
    
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }
    
    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      p => p.user._id.toString() === req.user.id && p.isActive
    );
    
    if (!isParticipant) {
      return res.status(403).json({ msg: 'Not authorized to access this conversation' });
    }
    
    res.json(conversation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/conversations/:id
// @desc    Update a conversation
// @access  Private
router.put('/:id', [
  auth,
  check('name', 'Name is required').optional().not().isEmpty()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid conversation ID' });
    }
    
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }
    
    // Check if user is a participant and has permission to change settings
    const participantData = conversation.participants.find(
      p => p.user.toString() === req.user.id && p.isActive
    );
    
    if (!participantData) {
      return res.status(403).json({ msg: 'Not authorized to access this conversation' });
    }
    
    const canChangeSettings = 
      conversation.permissions.canChangeSettings === 'all' || 
      (conversation.permissions.canChangeSettings === 'admins' && participantData.isAdmin) ||
      req.user.role === 'admin';
    
    if (!canChangeSettings) {
      return res.status(403).json({ msg: 'Not authorized to update this conversation' });
    }
    
    const { name, description, permissions } = req.body;
    
    // Update fields
    if (name) conversation.name = name;
    if (description !== undefined) conversation.description = description;
    if (permissions) conversation.permissions = { ...conversation.permissions, ...permissions };
    
    conversation.updatedAt = Date.now();
    
    await conversation.save();
    
    // Create system message for the update
    const systemMessage = new Message({
      conversation: conversation._id,
      sender: req.user.id,
      content: `${req.user.name} updated the conversation settings`,
      messageType: 'system',
      readBy: [req.user.id]
    });
    
    await systemMessage.save();
    
    // Update conversation with lastMessage and lastMessageAt
    conversation.lastMessage = systemMessage._id;
    conversation.lastMessageAt = systemMessage.createdAt;
    await conversation.save();
    
    // Populate conversation data before returning
    const populatedConversation = await Conversation.findById(conversation
