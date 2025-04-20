// Server entry point with updated MongoDB connection
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./utils/db-connection');
const { logInfo, logError } = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../web/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../web/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logError(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Get MongoDB URI from environment variables
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    
    // Connect to MongoDB
    await connectToDatabase(mongoUri);
    
    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      logInfo(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
    
    // Setup WebSocket for chat
    const setupWebSocket = require('./socket');
    setupWebSocket(app);
    
  } catch (error) {
    logError(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Start the server
startServer();
