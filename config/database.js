require('dotenv').config();
const mongoose = require('mongoose');
const tunnel = require('tunnel');
const { URL } = require('url');

const mongodbUri = process.env.MONGODB_URI;
const quotaguardUrl = process.env.QUOTAGUARDSTATIC_URL;

if (!mongodbUri || !quotaguardUrl) {
  console.error('❌ MONGODB_URI or QUOTAGUARDSTATIC_URL not defined.');
  process.exit(1);
}

let agent;
try {
  const proxyUri = new URL(quotaguardUrl);

  const [username, password] = proxyUri.username
    ? [proxyUri.username, proxyUri.password]
    : proxyUri.auth
    ? proxyUri.auth.split(':')
    : quotaguardUrl.replace('http://', '').split('@')[0].split(':');

  agent = tunnel.httpsOverHttp({
    proxy: {
      host: proxyUri.hostname,
      port: parseInt(proxyUri.port),
      proxyAuth: `${username}:${password}`
    }
  });
} catch (err) {
  console.error('❌ Proxy URL parsing failed:', err.message);
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
