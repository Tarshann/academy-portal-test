// server.js
require('dotenv').config();
console.log('🚀 App starting... loading modules');
require('./config/database'); // auto-connects when loaded
console.log('✅ connectDB() called successfully');
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

// Middleware
app.use(express.json({ extended: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // More secure CORS
  credentials: true
}));
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? true : false
}));
app.use(morgan('combined')); // More detailed logging

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
app.use('/api/auth', require('./routes/auth'));

// Routes with comprehensive error handling
const routeConfig = [
  { path: '/api/auth', file: './routes/auth' },
  { path: '/api/admin', file: './routes/admin' },
  { path: '/api/profile', file: './routes/profile' },
  { path: '/api/conversations', file: './routes/conversation' },
  { path: '/api/conversations/:conversationId/messages', file: './routes/message' } // Fixed path
];

routeConfig.forEach(route => {
  try {
    app.use(route.path, require(route.file));
    console.log(`Route ${route.path} loaded successfully`);
  } catch (err) {
    console.error(`Error loading route ${route.path}:`, {
      message: err.message,
      stack: err.stack
    });
  }
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', {
    message: err.message,
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
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Set port and start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', {
    message: error.message,
    name: error.name,
    stack: error.stack
  });
  process.exit(1);
});

module.exports = { app, server, io };
