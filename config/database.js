// config/database.js
require('dotenv').config();
const mongoose = require('mongoose');
const tunnel = require('tunnel');
const { URL } = require('url');
const https = require('https');

const mongodbUri = process.env.MONGODB_URI;
const quotaguardUrl = process.env.QUOTAGUARDSTATIC_URL;

function connectDB() {
  if (!mongodbUri || !quotaguardUrl) {
    console.error('❌ MONGODB_URI or QUOTAGUARDSTATIC_URL not defined.');
    process.exit(1);
  }

  try {
    const proxyUri = new URL(quotaguardUrl);

    const [username, password] = proxyUri.username
      ? [proxyUri.username, proxyUri.password]
      : proxyUri.auth.split(':');

    const agent = tunnel.httpsOverHttp({
      proxy: {
        host: proxyUri.hostname,
        port: parseInt(proxyUri.port),
        proxyAuth: `${username}:${password}`
      }
    });

    https.globalAgent = agent;
    console.log('🌐 Proxy tunnel set globally for HTTPS requests');
  } catch (err) {
    console.error('❌ Proxy URL parsing failed:', err.message);
    process.exit(1);
  }

  mongoose.connect(mongodbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log('✅ Connected to MongoDB via Quotaguard Static IP');
  }).catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });
}

module.exports = connectDB;
