// server.js
const connectDB = require('./config/database');
connectDB();
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

// Connect to MongoDB with more robust error handling
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // Increase timeout
  socketTimeoutMS: 45000
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('Detailed MongoDB Connection Error:', {
    message: err.message,
    name: err.name,
    code: err.code,
    connectionString: process.env.MONGODB_URI.replace(/:(.*?)@/, ':****@'), // Mask password
    fullError: err
  });
  // Log additional connection details
  console.log('Attempted Connection String:', process.env.MONGODB_URI.replace(/:(.*?)@/, ':****@'));
  process.exit(1);
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

// Routes with comprehensive error handling
const routeConfig = [
  { path: '/api/auth', file: './routes/auth' },
  { path: '/api/admin', file: './routes/admin' },
  { path: '/api/profile', file: './routes/profile' },
  { path: '/api/conversations', file: './routes/conversation' },
  { path: '/api/conversations', file: './routes/message' }
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
