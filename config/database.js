// Trigger redeploy for Heroku
require('dotenv').config();
console.log("🧪 MONGODB_URI:", process.env.MONGODB_URI);
console.log("🧪 QUOTAGUARDSTATIC_URL:", process.env.QUOTAGUARDSTATIC_URL);

const mongoose = require('mongoose');
const tunnel = require('tunnel');
const { URL } = require('url');

const mongodbUri = process.env.MONGODB_URI;
const proxyUri = new URL("http://585zbj3dyfhuty:3u29igvr8cu8ma0ciyikouzu6jc0@us-east-static-04.quotaguard.com:9293");

const agent = tunnel.httpsOverHttp({
  proxy: {
    host: proxyUri.hostname,
    port: parseInt(proxyUri.port),
    proxyAuth: `${proxyUri.username}:${proxyUri.password}`
  }
});

mongoose.connect(mongodbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  agent
}).then(() => {
  console.log('✅ Connected to MongoDB via Quotaguard Static IP');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});
