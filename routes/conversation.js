const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Helper to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Utility to create and attach a system message
const createSystemMessage = async (conversationId, senderId, content) => {
  const message = new Message({
    conversation: conversationId,
    sender: senderId,
    content,
    messageType: 'system',
    readBy: [senderId]
  });
  await message.save();
  return message;
};

// GET: All conversations for current user
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
    console.error('Error loading conversations:', err);
    res.status(500).send('Server error');
  }
});

// GET: Single conversation
router.get('/:id', auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ msg: 'Invalid conversation ID' });

  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants.user', 'name email profileImage')
      .populate('createdBy', 'name')
      .populate('lastMessage');

    if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });

    const isParticipant = conversation.participants.some(
      p => p.user._id.toString() === req.user.id && p.isActive
    );
    if (!isParticipant) return res.status(403).json({ msg: 'Not authorized' });

    res.json(conversation);
  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).send('Server error');
  }
});

// POST: Create new conversation
router.post('/', [
  auth,
  check('name', 'Name is required').not().isEmpty(),
  check('conversationType', 'Conversation type is required').isIn(['team', 'topic', 'direct']),
  check('participants', 'Participants required').isArray({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, conversationType, description, team, participants, permissions } = req.body;
  try {
    const userIds = [...new Set([...participants, req.user.id])];
    const validUsers = await User.find({
      _id: { $in: userIds },
      approvalStatus: 'approved',
      accountStatus: 'active'
    });

    if (validUsers.length !== userIds.length)
      return res.status(400).json({ errors: [{ msg: 'Invalid participant(s)' }] });

    const newConversation = new Conversation({
      name,
      conversationType,
      description,
      team,
      participants: userIds.map(uid => ({
        user: uid,
        isAdmin: uid.toString() === req.user.id.toString()
      })),
      permissions: permissions || {},
      createdBy: req.user.id
    });

    const conversation = await newConversation.save();
    const systemMessage = await createSystemMessage(conversation._id, req.user.id, `${req.user.name} created this conversation`);

    conversation.lastMessage = systemMessage._id;
    conversation.lastMessageAt = systemMessage.createdAt;
    await conversation.save();

    const populated = await Conversation.findById(conversation._id)
      .populate('participants.user', 'name email profileImage')
      .populate('createdBy', 'name')
      .populate('lastMessage');

    res.json(populated);
  } catch (err) {
    console.error('Error creating conversation:', err);
    res.status(500).send('Server error');
  }
});

// PUT: Update conversation settings
router.put('/:id', [
  auth,
  check('name', 'Name is required').optional().not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  if (!isValidObjectId(req.params.id)) return res.status(400).json({ msg: 'Invalid conversation ID' });

  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ msg: 'Not found' });

    const participantData = conversation.participants.find(p => p.user.toString() === req.user.id && p.isActive);
    if (!participantData) return res.status(403).json({ msg: 'Unauthorized' });

    const isAuthorized =
      conversation.permissions.canChangeSettings === 'all' ||
      (conversation.permissions.canChangeSettings === 'admins' && participantData.isAdmin) ||
      req.user.role === 'admin';

    if (!isAuthorized) return res.status(403).json({ msg: 'No permission' });

    const { name, description, permissions } = req.body;
    if (name) conversation.name = name;
    if (description !== undefined) conversation.description = description;
    if (permissions) conversation.permissions = { ...conversation.permissions, ...permissions };

    conversation.updatedAt = Date.now();
    await conversation.save();

    const systemMessage = await createSystemMessage(conversation._id, req.user.id, `${req.user.name} updated the conversation settings`);
    conversation.lastMessage = systemMessage._id;
    conversation.lastMessageAt = systemMessage.createdAt;
    await conversation.save();

    const populated = await Conversation.findById(conversation._id)
      .populate('participants.user', 'name email profileImage')
      .populate('createdBy', 'name')
      .populate('lastMessage');

    res.json(populated);
  } catch (err) {
    console.error('Error updating conversation:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
