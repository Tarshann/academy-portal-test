const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, type, isPublic, tags } = req.body;

    const group = await Group.create({
      name,
      description,
      type,
      isPublic,
      tags,
      owner: req.user.id,
      members: [{ user: req.user.id, role: 'admin' }],
    });

    res.status(201).json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Get all groups
// @route   GET /api/groups
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Group.find(JSON.parse(queryStr));

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Group.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const groups = await query.populate({
      path: 'owner',
      select: 'firstName lastName email profileImage',
    });

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: groups.length,
      pagination,
      data: groups,
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Get single group
// @route   GET /api/groups/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate({
        path: 'owner',
        select: 'firstName lastName email profileImage',
      })
      .populate({
        path: 'members.user',
        select: 'firstName lastName email profileImage',
      });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Make sure user is group owner or admin
    if (!group.isAdminOrOwner(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this group',
      });
    }

    const { name, description, type, isPublic, tags, image } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (type) updateFields.type = type;
    if (typeof isPublic !== 'undefined') updateFields.isPublic = isPublic;
    if (tags) updateFields.tags = tags;
    if (image) updateFields.image = image;

    group = await Group.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Delete group
// @route   DELETE /api/groups/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Make sure user is group owner
    if (group.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this group',
      });
    }

    await group.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Join a group
// @route   POST /api/groups/:id/join
// @access  Private
router.post('/:id/join', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Check if already a member
    if (group.isMember(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Already a member of this group',
      });
    }

    // Add member
    await group.addMember(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Joined group successfully',
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Leave a group
// @route   POST /api/groups/:id/leave
// @access  Private
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Check if a member
    if (!group.isMember(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Not a member of this group',
      });
    }

    // Check if owner
    if (group.owner.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Group owner cannot leave. Transfer ownership or delete group.',
      });
    }

    // Remove member
    await group.removeMember(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Left group successfully',
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Add a member to group
// @route   POST /api/groups/:id/members
// @access  Private (Admin/Owner only)
router.post('/:id/members', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Check if requester is admin or owner
    if (!group.isAdminOrOwner(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add members',
      });
    }

    const { userId, role = 'member' } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Add member
    await group.addMember(userId, role);

    res.status(200).json({
      success: true,
      message: 'Member added successfully',
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Remove a member from group
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private (Admin/Owner only)
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Check if requester is admin or owner
    if (!group.isAdminOrOwner(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove members',
      });
    }

    // Check if user to remove is owner
    if (group.owner.toString() === req.params.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove group owner',
      });
    }

    // Remove member
    await group.removeMember(req.params.userId);

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Update member role
// @route   PUT /api/groups/:id/members/:userId
// @access  Private (Owner only)
router.put('/:id/members/:userId', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Check if requester is owner
    if (group.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only group owner can update member roles',
      });
    }

    const { role } = req.body;

    // Update member role
    const updated = await group.updateMemberRole(req.params.userId, role);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in group',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Get user's groups
// @route   GET /api/groups/user/me
// @access  Private
router.get('/user/me', protect, async (req, res) => {
  try {
    // Find groups where user is owner or member
    const groups = await Group.find({
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ]
    });

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups,
    });
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

module.exports = router; 