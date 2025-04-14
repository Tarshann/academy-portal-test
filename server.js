// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});
global.io = io; // Make globally accessible for events

// Connect DB
require('./config/database');

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Swagger Docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Log each request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/conversations', require('./routes/conversation'));
app.use('/api/conversations/:conversationId/messages', require('./routes/message'));

// Webhook for Push Notifications
app.post('/api/notify/webhook', (req, res) => {
  const { type, userId, message } = req.body;
  console.log(`📢 Notification Webhook Triggered: [${type}] ${message}`);
  io.emit('notification', { type, userId, message });
  res.status(200).json({ success: true });
});

// Serve React in Production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (_, res) =>
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
  );
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', {
    message: err.message,
    path: req.path,
    method: req.method,
    stack: err.stack
  });
  res.status(500).json({ error: 'Server Error', message: err.message });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () =>
  console.log(`✅ Server running on port ${PORT} (${process.env.NODE_ENV})`)
);

// Global Error Catchers
process.on('unhandledRejection', reason => console.error('🚨 Unhandled Rejection:', reason));
process.on('uncaughtException', err => {
  console.error('🚨 Uncaught Exception:', err);
  process.exit(1);
});

module.exports = { app, server, io };
