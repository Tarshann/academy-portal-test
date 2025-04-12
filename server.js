// Extremely simple server.js file
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Simple route that returns a message
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>The Academy Portal</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background-color: #f5f5f5;
        }
        .container {
          text-align: center;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-width: 500px;
        }
        h1 {
          color: #002244;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>The Academy Portal</h1>
        <p>Hello World! The server is running successfully.</p>
        <p>This is a minimal test page to verify deployment.</p>
      </div>
    </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
