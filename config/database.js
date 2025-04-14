// Trigger redeploy for Heroku
require('dotenv').config();

const mongoose = require('mongoose');
const tunnel = require('tunnel');
const { URL } = require('url');

// Safely load and validate environment variables
const mongodbUri = process.env.MONGODB_URI || '';
const quotaguardUrl = process.env.QUOTAGUARDSTATIC_URL || '';

console.log("🧪 MONGODB_URI:", mongodbUri);
console.log("🧪 QUOTAGUARDSTATIC_URL:", quotaguardUrl);

let agent = null;

try {
  const proxyUri = new URL(quotaguardUrl);

  agent = tunnel.httpsOverHttp({
    proxy: {
      host: proxyUri.hostname,
      port: parseInt(proxyUri.port),
      proxyAuth: `${proxyUri.username}:${proxyUri.password}`
    }
  });
} catch (err) {
  console.error('❌ Invalid QUOTAGUARDSTATIC_URL format:', err.message);
  process.exit(1);
}

mongoose.connect(mongodbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  agent
}).then(() => {
  console.log('✅ Connected to MongoDB via Quotaguard Static IP');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});
