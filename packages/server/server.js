const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Log environment for debugging
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current directory:', __dirname);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to Academy Portal API' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const webBuildPath = path.join(__dirname, '../web/build');
  const indexPath = path.join(webBuildPath, 'index.html');
  
  console.log('Web build path:', webBuildPath);
  console.log('Index path:', indexPath);
  console.log('Build directory exists:', fs.existsSync(webBuildPath));
  console.log('Index file exists:', fs.existsSync(indexPath));
  
  // List files in build directory if it exists
  if (fs.existsSync(webBuildPath)) {
    console.log('Files in build directory:', fs.readdirSync(webBuildPath));
  }
  
  // Serve web build folder
  app.use(express.static(webBuildPath));
  
  // Handle React routing
  app.get('*', (req, res) => {
    console.log('Serving index.html for path:', req.path);
    res.sendFile(indexPath);
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 