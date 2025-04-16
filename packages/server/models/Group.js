const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a group name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['team', 'class', 'event', 'organization'],
      default: 'team',
    },
    image: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['admin', 'moderator', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching groups by name
GroupSchema.index({ name: 'text', description: 'text' });

// Add a member to the group
GroupSchema.methods.addMember = async function (userId, role = 'member') {
  if (!this.members.some(member => member.user.toString() === userId.toString())) {
    this.members.push({
      user: userId,
      role,
      joinedAt: Date.now(),
    });
  }
  return this.save();
};

// Remove a member from the group
GroupSchema.methods.removeMember = async function (userId) {
  this.members = this.members.filter(
    member => member.user.toString() !== userId.toString()
  );
  return this.save();
};

// Update a member's role
GroupSchema.methods.updateMemberRole = async function (userId, newRole) {
  const memberIndex = this.members.findIndex(
    member => member.user.toString() === userId.toString()
  );
  
  if (memberIndex !== -1) {
    this.members[memberIndex].role = newRole;
    return this.save();
  }
  
  return null;
};

// Check if a user is a member
GroupSchema.methods.isMember = function (userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

// Check if a user is an admin or owner
GroupSchema.methods.isAdminOrOwner = function (userId) {
  if (this.owner.toString() === userId.toString()) {
    return true;
  }
  
  return this.members.some(
    member => 
      member.user.toString() === userId.toString() && 
      (member.role === 'admin' || member.role === 'moderator')
  );
};

module.exports = mongoose.model('Group', GroupSchema); 