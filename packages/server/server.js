const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Log startup information
console.log('=== SERVER STARTING ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current directory:', __dirname);
console.log('PORT:', PORT);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    env: process.env.NODE_ENV,
    time: new Date().toISOString()
  });
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

// List directory contents for debugging
app.get('/debug-dir', (req, res) => {
  const dirPath = path.resolve(__dirname, '../web');
  const buildPath = path.resolve(__dirname, '../web/build');
  
  let output = '<h1>Directory Contents</h1>';
  
  try {
    output += `<h2>Web Directory:</h2><pre>${__dirname}\n${fs.existsSync(dirPath) ? 'EXISTS' : 'MISSING'}</pre>`;
    if (fs.existsSync(dirPath)) {
      output += `<pre>${fs.readdirSync(dirPath).join('\n')}</pre>`;
    }
    
    output += `<h2>Build Directory:</h2><pre>${buildPath}\n${fs.existsSync(buildPath) ? 'EXISTS' : 'MISSING'}</pre>`;
    if (fs.existsSync(buildPath)) {
      output += `<pre>${fs.readdirSync(buildPath).join('\n')}</pre>`;
    }
  } catch (err) {
    output += `<h2>Error:</h2><pre>${err.message}</pre>`;
  }
  
  res.send(output);
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
  } else {
    console.error('ERROR: Build directory does not exist!');
    // Create a basic directory to prevent errors
    try {
      fs.mkdirSync(webBuildPath, { recursive: true });
      fs.writeFileSync(indexPath, `
        <!DOCTYPE html>
        <html>
          <head><title>Academy Portal</title></head>
          <body>
            <h1>Error: Missing Build Files</h1>
            <p>The web application build files were not found.</p>
            <p>Please check the deployment logs.</p>
          </body>
        </html>
      `);
      console.log('Created emergency index.html file');
    } catch (err) {
      console.error('Failed to create emergency index.html:', err);
    }
  }
  
  // Serve web build folder
  app.use(express.static(webBuildPath));
  
  // Handle React routing
  app.get('*', (req, res) => {
    console.log('Serving index.html for path:', req.path);
    // Check if index.html exists, otherwise send a fallback
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Academy Portal - Error</title></head>
          <body>
            <h1>Error: Missing index.html</h1>
            <p>The web application index.html file was not found.</p>
            <p>Please check the deployment logs.</p>
            <p>Try visiting the <a href="/test-page">test page</a> or <a href="/debug-dir">debug directory listing</a>.</p>
          </body>
        </html>
      `);
    }
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 