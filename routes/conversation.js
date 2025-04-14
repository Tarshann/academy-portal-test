// routes/conversation.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// GET all conversations for the current user
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

// PUT update conversation by ID
router.put('/:id', [
  auth,
  check('name', 'Name is required').optional().not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid conversation ID' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });

    const participantData = conversation.participants.find(
      p => p.user.toString() === req.user.id && p.isActive
    );

    if (!participantData) return res.status(403).json({ msg: 'Not authorized' });

    const canChangeSettings =
      conversation.permissions.canChangeSettings === 'all' ||
      (conversation.permissions.canChangeSettings === 'admins' && participantData.isAdmin) ||
      req.user.role === 'admin';

    if (!canChangeSettings) return res.status(403).json({ msg: 'Permission denied' });

    const { name, description, permissions } = req.body;
    if (name) conversation.name = name;
    if (description !== undefined) conversation.description = description;
    if (permissions) conversation.permissions = { ...conversation.permissions, ...permissions };

    conversation.updatedAt = Date.now();
    await conversation.save();

    const systemMessage = new Message({
      conversation: conversation._id,
      sender: req.user.id,
      content: `${req.user.name} updated the conversation settings`,
      messageType: 'system',
      readBy: [req.user.id]
    });
    await systemMessage.save();

    conversation.lastMessage = systemMessage._id;
    conversation.lastMessageAt = systemMessage.createdAt;
    await conversation.save();

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

// GET specific conversation by ID
router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid conversation ID' });
    }

    const conversation = await Conversation.findById(req.params.id)
      .populate('participants.user', 'name email profileImage')
      .populate('createdBy', 'name')
      .populate('lastMessage');

    if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });

    const isParticipant = conversation.participants.some(
      p => p.user._id.toString() === req.user.id && p.isActive
    );

    if (!isParticipant) return res.status(403).json({ msg: 'Access denied' });

    res.json(conversation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
