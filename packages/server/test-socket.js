const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

// Create a simple Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Set JWT secret
const JWT_SECRET = 'test_secret';

// Create a test user
const testUser = {
  _id: '123456789012345678901234',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com'
};

// Create a test JWT token
const token = jwt.sign({ id: testUser._id }, JWT_SECRET, { expiresIn: '1h' });
console.log('Test JWT token:', token);

// Socket.io middleware for authentication
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    // Verify token (in test we're not checking against DB)
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach test user to socket
    socket.user = testUser;
    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    next(new Error('Authentication error'));
  }
});

// Socket connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.email}`);
  
  // Join user to a test group
  const testGroup = {
    _id: '987654321098765432109876',
    name: 'Test Group'
  };
  
  socket.join(`group:${testGroup._id}`);
  
  // Notify user of successful connection
  socket.emit('groups:joined', {
    count: 1,
    groups: [{ id: testGroup._id, name: testGroup.name }],
    unreadNotifications: 0
  });
  
  // Listen for message events
  socket.on('message:send', (data) => {
    console.log('Message received:', data);
    
    // Echo the message back to sender
    socket.emit('message:sent', {
      _id: 'msg_' + Date.now(),
      group: data.groupId,
      sender: socket.user,
      content: data.content,
      createdAt: new Date().toISOString()
    });
    
    // Broadcast to other users in the group (which is just the sender in this test)
    socket.to(`group:${data.groupId}`).emit('message:received', {
      _id: 'msg_' + Date.now(),
      group: data.groupId,
      sender: socket.user,
      content: data.content,
      createdAt: new Date().toISOString()
    });
  });
  
  // Listen for typing events
  socket.on('typing:start', (data) => {
    console.log('User started typing in group:', data.groupId);
    
    socket.to(`group:${data.groupId}`).emit('typing:started', {
      user: {
        id: socket.user._id,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName,
      },
      groupId: data.groupId,
    });
  });
  
  socket.on('typing:stop', (data) => {
    console.log('User stopped typing in group:', data.groupId);
    
    socket.to(`group:${data.groupId}`).emit('typing:stopped', {
      user: {
        id: socket.user._id,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName,
      },
      groupId: data.groupId,
    });
  });
  
  // Disconnect event
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.email}`);
  });
});

// Start the server
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Test socket server running on port ${PORT}`);
  console.log(`Open test-client.html in your browser and use the token to connect`);
}); 