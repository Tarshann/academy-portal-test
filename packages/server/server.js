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

// Static test page for diagnosing routing issues
app.get('/test-page', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Static Test Page</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          .success { color: green; }
          .details { margin-top: 20px; text-align: left; max-width: 600px; margin: 20px auto; padding: 20px; background: #f5f5f5; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1 class="success">Static Test Page Working!</h1>
        <p>If you can see this page, the server is running correctly.</p>
        <div class="details">
          <h3>Server Environment:</h3>
          <pre>NODE_ENV: ${process.env.NODE_ENV}</pre>
          <pre>PORT: ${PORT}</pre>
          <pre>Server Time: ${new Date().toISOString()}</pre>
          <pre>Server Directory: ${__dirname}</pre>
        </div>
      </body>
    </html>
  `);
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