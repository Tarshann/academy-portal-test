const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const Group = require('./models/Group');
const Notification = require('./models/Notification');

// Socket.io setup
const setupSocketIO = (io) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket auth error:', error.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.email}`);
    
    // Join user to their private room
    socket.join(`user:${socket.user._id}`);
    
    // Join user groups
    joinUserGroups(socket);
    
    // Listen for message events
    socket.on('message:send', handleSendMessage(socket, io));
    
    // Listen for typing events
    socket.on('typing:start', handleTypingStart(socket));
    socket.on('typing:stop', handleTypingStop(socket));
    
    // Listen for read events
    socket.on('message:read', handleMessageRead(socket));
    socket.on('notification:read', handleNotificationRead(socket));
    
    // Listen for group events
    socket.on('group:join', handleJoinGroup(socket, io));
    socket.on('group:leave', handleLeaveGroup(socket, io));
    
    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.email}`);
    });
  });
};

// Join user to their group rooms
const joinUserGroups = async (socket) => {
  try {
    // Find all groups user is a member of
    const groups = await Group.find({
      $or: [
        { owner: socket.user._id },
        { 'members.user': socket.user._id }
      ]
    });
    
    // Join each group room
    groups.forEach(group => {
      socket.join(`group:${group._id}`);
      console.log(`User ${socket.user.email} joined group ${group.name}`);
    });
    
    // Get unread notification count
    const unreadCount = await Notification.getUnreadCount(socket.user._id);
    
    // Notify user of successful connection
    socket.emit('groups:joined', {
      count: groups.length,
      groups: groups.map(group => ({
        id: group._id,
        name: group.name
      })),
      unreadNotifications: unreadCount
    });
  } catch (error) {
    console.error('Error joining user groups:', error);
    socket.emit('error', { message: 'Failed to join groups' });
  }
};

// Handle send message
const handleSendMessage = (socket, io) => async (data) => {
  try {
    const { groupId, content, attachments } = data;
    
    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return socket.emit('error', { message: 'Group not found' });
    }
    
    if (!group.isMember(socket.user._id)) {
      return socket.emit('error', { message: 'Not a member of this group' });
    }
    
    // Create message
    const message = await Message.create({
      group: groupId,
      sender: socket.user._id,
      content,
      attachments: attachments || [],
      readBy: [{ user: socket.user._id, readAt: Date.now() }],
    });
    
    // Populate sender information
    const populatedMessage = await Message.findById(message._id).populate({
      path: 'sender',
      select: 'firstName lastName email profileImage',
    });
    
    // Broadcast message to group room
    socket.to(`group:${groupId}`).emit('message:received', populatedMessage);
    
    // Acknowledge message receipt to sender
    socket.emit('message:sent', populatedMessage);
    
    // Create notifications for group members (except sender)
    const groupMembers = await User.find({
      _id: {
        $in: group.members.map(member => member.user),
        $ne: socket.user._id
      }
    });
    
    // Create notifications in parallel
    await Promise.all(
      groupMembers.map(async (member) => {
        // Only create notification if user's preferences allow it
        if (member.preferences?.emailNotifications !== false) {
          const notification = await Notification.createMessageNotification(
            member._id,
            socket.user._id,
            groupId,
            message._id,
            content
          );
          
          // Emit notification to the recipient if they're online
          io.to(`user:${member._id}`).emit('notification:new', notification);
        }
      })
    );
    
  } catch (error) {
    console.error('Error sending message:', error);
    socket.emit('error', { message: 'Failed to send message' });
  }
};

// Handle typing start
const handleTypingStart = (socket) => (data) => {
  const { groupId } = data;
  socket.to(`group:${groupId}`).emit('typing:started', {
    user: {
      id: socket.user._id,
      firstName: socket.user.firstName,
      lastName: socket.user.lastName,
    },
    groupId,
  });
};

// Handle typing stop
const handleTypingStop = (socket) => (data) => {
  const { groupId } = data;
  socket.to(`group:${groupId}`).emit('typing:stopped', {
    user: {
      id: socket.user._id,
      firstName: socket.user.firstName,
      lastName: socket.user.lastName,
    },
    groupId,
  });
};

// Handle message read
const handleMessageRead = (socket) => async (data) => {
  try {
    const { messageId } = data;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return socket.emit('error', { message: 'Message not found' });
    }
    
    // Mark as read
    await message.markAsRead(socket.user._id);
    
    // Notify message sender that message was read
    socket.to(`user:${message.sender}`).emit('message:read', {
      messageId,
      readBy: {
        id: socket.user._id,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName,
      },
      groupId: message.group,
    });
    
  } catch (error) {
    console.error('Error marking message as read:', error);
    socket.emit('error', { message: 'Failed to mark message as read' });
  }
};

// Handle notification read
const handleNotificationRead = (socket) => async (data) => {
  try {
    const { notificationId } = data;
    
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return socket.emit('error', { message: 'Notification not found' });
    }
    
    // Check if recipient is the current user
    if (notification.recipient.toString() !== socket.user._id.toString()) {
      return socket.emit('error', { message: 'Not authorized to mark this notification as read' });
    }
    
    // Mark as read
    await notification.markAsRead();
    
    // Emit updated unread count
    const unreadCount = await Notification.getUnreadCount(socket.user._id);
    socket.emit('notification:unread-count', { count: unreadCount });
    
  } catch (error) {
    console.error('Error marking notification as read:', error);
    socket.emit('error', { message: 'Failed to mark notification as read' });
  }
};

// Handle join group
const handleJoinGroup = (socket, io) => async (data) => {
  try {
    const { groupId } = data;
    
    const group = await Group.findById(groupId);
    if (!group) {
      return socket.emit('error', { message: 'Group not found' });
    }
    
    // Check if already a member
    if (group.isMember(socket.user._id)) {
      socket.join(`group:${groupId}`);
      return socket.emit('group:joined', { id: group._id, name: group.name });
    }
    
    // Add user to group
    await group.addMember(socket.user._id);
    
    // Join socket room
    socket.join(`group:${groupId}`);
    
    // Notify user
    socket.emit('group:joined', { id: group._id, name: group.name });
    
    // Notify other group members
    socket.to(`group:${groupId}`).emit('group:member-joined', {
      groupId,
      user: {
        id: socket.user._id,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName,
        profileImage: socket.user.profileImage
      }
    });
    
    // Create notification for group owner
    await Notification.create({
      recipient: group.owner,
      sender: socket.user._id,
      type: 'group_join',
      title: 'New Group Member',
      content: `${socket.user.firstName} ${socket.user.lastName} joined ${group.name}`,
      group: groupId,
      link: `/groups/${groupId}`,
      metadata: {
        groupId: groupId.toString(),
        groupName: group.name,
      }
    });
    
    // Emit notification to group owner if online
    io.to(`user:${group.owner}`).emit('notification:new', {
      type: 'group_join',
      title: 'New Group Member',
      content: `${socket.user.firstName} ${socket.user.lastName} joined ${group.name}`,
      groupId: groupId,
    });
    
  } catch (error) {
    console.error('Error joining group:', error);
    socket.emit('error', { message: 'Failed to join group' });
  }
};

// Handle leave group
const handleLeaveGroup = (socket, io) => async (data) => {
  try {
    const { groupId } = data;
    
    const group = await Group.findById(groupId);
    if (!group) {
      return socket.emit('error', { message: 'Group not found' });
    }
    
    // Check if member
    if (!group.isMember(socket.user._id)) {
      return socket.emit('error', { message: 'Not a member of this group' });
    }
    
    // Check if owner
    if (group.owner.toString() === socket.user._id.toString()) {
      return socket.emit('error', { message: 'Owner cannot leave group' });
    }
    
    // Remove from group
    await group.removeMember(socket.user._id);
    
    // Leave socket room
    socket.leave(`group:${groupId}`);
    
    // Notify user
    socket.emit('group:left', { id: group._id, name: group.name });
    
    // Notify other group members
    socket.to(`group:${groupId}`).emit('group:member-left', {
      groupId,
      user: {
        id: socket.user._id,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName
      }
    });
    
    // Create notification for group owner
    await Notification.create({
      recipient: group.owner,
      sender: socket.user._id,
      type: 'group_leave',
      title: 'Member Left Group',
      content: `${socket.user.firstName} ${socket.user.lastName} left ${group.name}`,
      group: groupId,
      link: `/groups/${groupId}`,
      metadata: {
        groupId: groupId.toString(),
        groupName: group.name,
      }
    });
    
    // Emit notification to group owner if online
    io.to(`user:${group.owner}`).emit('notification:new', {
      type: 'group_leave',
      title: 'Member Left Group',
      content: `${socket.user.firstName} ${socket.user.lastName} left ${group.name}`,
      groupId: groupId,
    });
    
  } catch (error) {
    console.error('Error leaving group:', error);
    socket.emit('error', { message: 'Failed to leave group' });
  }
};

module.exports = setupSocketIO; 