const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Group = require('../models/Group');
const { protect } = require('../middleware/auth');

// @desc    Get messages for a group
// @route   GET /api/messages/:groupId
// @access  Private
router.get('/:groupId', protect, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    if (!group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group',
      });
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get messages
    const messages = await Message.find({
      group: groupId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'sender',
        select: 'firstName lastName email profileImage',
      });

    // Count total messages
    const total = await Message.countDocuments({
      group: groupId,
      isDeleted: false,
    });

    // Mark messages as read by the current user
    const messageIds = messages.map(message => message._id);
    if (messageIds.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          'readBy.user': { $ne: req.user.id },
          sender: { $ne: req.user.id },
        },
        {
          $push: {
            readBy: {
              user: req.user.id,
              readAt: Date.now(),
            },
          },
        }
      );
    }

    // Pagination info
    const pagination = {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    };

    res.status(200).json({
      success: true,
      count: messages.length,
      pagination,
      data: messages,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Send a message to a group
// @route   POST /api/messages/:groupId
// @access  Private
router.post('/:groupId', protect, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, attachments } = req.body;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    if (!group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group',
      });
    }

    // Create message
    const message = await Message.create({
      group: groupId,
      sender: req.user.id,
      content,
      attachments: attachments || [],
      readBy: [{ user: req.user.id, readAt: Date.now() }],
    });

    // Populate sender information
    const populatedMessage = await Message.findById(message._id).populate({
      path: 'sender',
      select: 'firstName lastName email profileImage',
    });

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Edit a message
// @route   PUT /api/messages/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    let message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this message',
      });
    }

    // Edit message
    await message.editContent(content);

    // Refresh message data
    message = await Message.findById(id).populate({
      path: 'sender',
      select: 'firstName lastName email profileImage',
    });

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      // Check if user is a group admin or owner
      const group = await Group.findById(message.group);
      
      if (!group || !group.isAdminOrOwner(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this message',
        });
      }
    }

    // Soft delete message
    await message.softDelete();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Get unread message count for all groups
// @route   GET /api/messages/unread/count
// @access  Private
router.get('/unread/count', protect, async (req, res) => {
  try {
    // Find all groups the user is a member of
    const groups = await Group.find({
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ]
    });

    const groupIds = groups.map(group => group._id);
    
    // Count unread messages for each group
    const unreadCounts = {};
    
    await Promise.all(
      groupIds.map(async (groupId) => {
        const count = await Message.countDocuments({
          group: groupId,
          'readBy.user': { $ne: req.user.id },
          sender: { $ne: req.user.id },
          isDeleted: false,
        });
        unreadCounts[groupId.toString()] = count;
      })
    );

    res.status(200).json({
      success: true,
      data: unreadCounts,
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Mark all messages in a group as read
// @route   PUT /api/messages/:groupId/read
// @access  Private
router.put('/:groupId/read', protect, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    if (!group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group',
      });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        group: groupId,
        'readBy.user': { $ne: req.user.id },
        sender: { $ne: req.user.id },
        isDeleted: false,
      },
      {
        $push: {
          readBy: {
            user: req.user.id,
            readAt: Date.now(),
          },
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'All messages marked as read',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

module.exports = router; 