const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const rateLimiter = require('../middleware/rateLimiter');
const notify = require('../utils/notify');
const { check, validationResult } = require('express-validator');

// Helper
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const createSystemMessage = async (conversation, senderId, content) => {
  const msg = new Message({
    conversation: conversation._id,
    sender: senderId,
    content,
    messageType: 'system',
    readBy: [senderId]
  });
  await msg.save();
  conversation.lastMessage = msg._id;
  conversation.lastMessageAt = msg.createdAt;
  await conversation.save();
  await notify.sendToParticipants(conversation.participants.map(p => p.user), content);
};

// GET all conversations
router.get('/', auth, rateLimiter, async (req, res) => {
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
    console.error('[GET /conversations]', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET single conversation
router.get('/:id', auth, rateLimiter, async (req, res) => {
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ msg: 'Invalid ID' });
  try {
    const convo = await Conversation.findById(req.params.id)
      .populate('participants.user', 'name email profileImage')
      .populate('createdBy', 'name')
      .populate('lastMessage');
    if (!convo) return res.status(404).json({ msg: 'Not found' });
    const isParticipant = convo.participants.some(p => p.user._id.toString() === req.user.id && p.isActive);
    if (!isParticipant) return res.status(403).json({ msg: 'Unauthorized' });
    res.json(convo);
  } catch (err) {
    console.error('[GET /:id]', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST create conversation
router.post('/', [
  auth,
  rateLimiter,
  check('name').notEmpty(),
  check('conversationType').isIn(['team', 'topic', 'direct']),
  check('participants').isArray({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, conversationType, description, team, participants, permissions } = req.body;
    const allUsers = [...new Set([...participants, req.user.id])];
    const validUsers = await User.find({ _id: { $in: allUsers }, approvalStatus: 'approved', accountStatus: 'active' });
    if (validUsers.length !== allUsers.length) return res.status(400).json({ msg: 'Invalid participants' });
    const convo = await new Conversation({
      name,
      conversationType,
      description,
      team,
      participants: allUsers.map(u => ({ user: u, isAdmin: u.toString() === req.user.id })),
      permissions,
      createdBy: req.user.id
    }).save();
    await createSystemMessage(convo, req.user.id, `${req.user.name} created this conversation`);
    const populated = await Conversation.findById(convo._id)
      .populate('participants.user', 'name email profileImage')
      .populate('createdBy', 'name')
      .populate('lastMessage');
    res.status(201).json(populated);
  } catch (err) {
    console.error('[POST /]', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update conversation
router.put('/:id', [auth, rateLimiter, check('name').optional().notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ msg: 'Invalid ID' });
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ msg: 'Not found' });
    const participant = convo.participants.find(p => p.user.toString() === req.user.id && p.isActive);
    if (!participant) return res.status(403).json({ msg: 'Unauthorized' });
    const canUpdate = convo.permissions.canChangeSettings === 'all' ||
      (convo.permissions.canChangeSettings === 'admins' && participant.isAdmin) ||
      req.user.role === 'admin';
    if (!canUpdate) return res.status(403).json({ msg: 'Permission denied' });
    Object.assign(convo, req.body);
    convo.updatedAt = Date.now();
    await convo.save();
    await createSystemMessage(convo, req.user.id, `${req.user.name} updated conversation settings`);
    const populated = await Conversation.findById(convo._id)
      .populate('participants.user', 'name email profileImage')
      .populate('createdBy', 'name')
      .populate('lastMessage');
    res.json(populated);
  } catch (err) {
    console.error('[PUT /:id]', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT archive/unarchive
router.put('/:id/archive', auth, rateLimiter, async (req, res) => {
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ msg: 'Invalid ID' });
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ msg: 'Not found' });
    const participant = convo.participants.find(p => p.user.toString() === req.user.id && p.isActive);
    if (!participant) return res.status(403).json({ msg: 'Unauthorized' });
    const canArchive = convo.permissions.canChangeSettings === 'all' ||
      (convo.permissions.canChangeSettings === 'admins' && participant.isAdmin) ||
      req.user.role === 'admin';
    if (!canArchive) return res.status(403).json({ msg: 'Permission denied' });
    convo.isArchived = !convo.isArchived;
    convo.updatedAt = Date.now();
    await convo.save();
    await createSystemMessage(convo, req.user.id, `${req.user.name} ${convo.isArchived ? 'archived' : 'unarchived'} this conversation`);
    const populated = await Conversation.findById(convo._id)
      .populate('participants.user', 'name email profileImage')
      .populate('createdBy', 'name')
      .populate('lastMessage');
    res.json(populated);
  } catch (err) {
    console.error('[PUT /:id/archive]', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST add participants
router.post('/:id/participants', [auth, rateLimiter, check('participants').isArray({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { participants } = req.body;
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ msg: 'Invalid ID' });
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ msg: 'Not found' });
    const participant = convo.participants.find(p => p.user.toString() === req.user.id && p.isActive);
    if (!participant) return res.status(403).json({ msg: 'Unauthorized' });
    const canAdd = convo.permissions.canAddParticipants === 'all' ||
      (convo.permissions.canAddParticipants === 'admins' && participant.isAdmin) ||
      req.user.role === 'admin';
    if (!canAdd) return res.status(403).json({ msg: 'Permission denied' });
    const newUsers = await User.find({ _id: { $in: participants }, approvalStatus: 'approved', accountStatus: 'active' });
    const names = [];
    for (const user of newUsers) {
      const exists = convo.participants.find(p => p.user.toString() === user._id.toString());
      if (exists && exists.isActive) continue;
      if (exists) {
        exists.isActive = true;
        exists.joinedAt = Date.now();
      } else {
        convo.participants.push({ user: user._id, isAdmin: false, joinedAt: Date.now() });
      }
      names.push(user.name);
    }
    convo.updatedAt = Date.now();
    await convo.save();
    await createSystemMessage(convo, req.user.id, `${req.user.name} added ${names.join(', ')} to the conversation`);
    const populated = await Conversation.findById(convo._id)
      .populate('participants.user', 'name email profileImage')
      .populate('createdBy', 'name')
      .populate('lastMessage');
    res.json(populated);
  } catch (err) {
    console.error('[POST /:id/participants]', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE remove participant
router.delete('/:id/participants/:userId', auth, rateLimiter, async (req, res) => {
  const { id, userId } = req.params;
  if (!isValidObjectId(id) || !isValidObjectId(userId)) return res.status(400).json({ msg: 'Invalid ID(s)' });
  try {
    const convo = await Conversation.findById(id);
    if (!convo) return res.status(404).json({ msg: 'Not found' });
    const targetIdx = convo.participants.findIndex(p => p.user.toString() === userId && p.isActive);
    if (targetIdx === -1) return res.status(404).json({ msg: 'User not found in conversation' });
    const isSelf = userId === req.user.id;
    const current = convo.participants.find(p => p.user.toString() === req.user.id && p.isActive);
    if (!isSelf) {
      const canRemove = convo.permissions.canRemoveParticipants === 'all' ||
        (convo.permissions.canRemoveParticipants === 'admins' && current?.isAdmin) ||
        req.user.role === 'admin';
      if (!canRemove) return res.status(403).json({ msg: 'Permission denied' });
    }
    const removedUser = await User.findById(userId);
    convo.participants[targetIdx].isActive = false;
    convo.updatedAt = Date.now();
    await convo.save();
    const action = isSelf ? 'left' : 'was removed from';
    await createSystemMessage(convo, req.user.id, `${removedUser.name} ${action} the conversation`);
    const populated = await Conversation.findById(convo._id)
      .populate('participants.user', 'name email profileImage')
      .populate('createdBy', 'name')
      .populate('lastMessage');
    res.json(populated);
  } catch (err) {
    console.error('[DELETE /:id/participants/:userId]', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
