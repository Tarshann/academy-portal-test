// routes/conversation.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const rateLimiter = require('../middleware/rateLimiter');
const { check, validationResult } = require('express-validator');

// Swagger tags for grouping
/**
 * @swagger
 * tags:
 *   name: Conversations
 *   description: API for managing conversations
 */

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get all conversations for the current user
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     summary: Create a new conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - conversationType
 *               - participants
 *             properties:
 *               name:
 *                 type: string
 *               conversationType:
 *                 type: string
 *               description:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Conversation created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', [
  auth,
  rateLimiter,
  check('name', 'Name is required').notEmpty(),
  check('conversationType', 'Invalid type').isIn(['team', 'topic', 'direct']),
  check('participants', 'Participants are required').isArray({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, conversationType, description, team, participants, permissions } = req.body;

  try {
    const uniqueUserIds = [...new Set([...participants, req.user.id])];
    const validUsers = await User.find({
      _id: { $in: uniqueUserIds },
      approvalStatus: 'approved',
      accountStatus: 'active'
    });

    if (validUsers.length !== uniqueUserIds.length) {
      return res.status(400).json({ errors: [{ msg: 'One or more participants are invalid' }] });
    }

    const newConversation = new Conversation({
      name,
      conversationType,
      description,
      team,
      participants: uniqueUserIds.map(userId => ({
        user: userId,
        isAdmin: userId.toString() === req.user.id
      })),
      permissions: permissions || {},
      createdBy: req.user.id
    });

    const conversation = await newConversation.save();
    const systemMessage = await new Message({
      conversation: conversation._id,
      sender: req.user.id,
      content: `${req.user.name} created this conversation`,
      messageType: 'system',
      readBy: [req.user.id]
    }).save();

    conversation.lastMessage = systemMessage._id;
    conversation.lastMessageAt = systemMessage.createdAt;
    await conversation.save();

    const populated = await Conversation.findById(conversation._id)
      .populate('participants.user', 'name email profileImage')
      .populate('createdBy', 'name')
      .populate('lastMessage');

    res.status(201).json(populated);
  } catch (err) {
    console.error('[POST /conversations]', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Additional routes (archive, participants, delete, update, etc.) are being added next

module.exports = router;
