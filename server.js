// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Create HTTP server with Express app
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB Connection Error:', {
    message: err.message,
    name: err.name,
    code: err.code
  });
  process.exit(1);
});

// Middleware
app.use(express.json({ extended: false }));
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for development, enable in production
}));
app.use(morgan('dev')); // Logging

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.path}`);
  next();
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/conversations', require('./routes/conversation'));
app.use('/api/conversations', require('./routes/message'));
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', {
    message: err.message,
    name: err.name,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Socket.IO Connection Handling
io.on('connection', socket => {
  console.log('New client connected');
  
  // Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      // Here we would verify the JWT token
      // For now, we'll just log it
      console.log('Socket authenticated:', token);
      
      // Store user ID in socket object for later use
      socket.userId = 'user_id_from_token';
    } catch (err) {
      console.error('Socket authentication error:', err);
    }
  });
  
  // Join conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`Socket joined conversation: ${conversationId}`);
  });
  
  // Leave conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(`Socket left conversation: ${conversationId}`);
  });
  
  // User typing indicator
  socket.on('typing', (data) => {
    const { conversationId } = data;
    socket.to(`conversation:${conversationId}`).emit('typing', {
      conversationId,
      userId: socket.userId
    });
  });
  
  // User stopped typing indicator
  socket.on('stop_typing', (data) => {
    const { conversationId } = data;
    socket.to(`conversation:${conversationId}`).emit('stop_typing', {
      conversationId,
      userId: socket.userId
    });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Export socket.io instance for use in routes
module.exports.io = io;

// Set port for the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
// Start server
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', {
    message: error.message,
    name: error.name,
    stack: error.stack
  });
  // Optional: Graceful shutdown
  process.exit(1);
});
