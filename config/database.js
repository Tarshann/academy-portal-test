require('dotenv').config();
const tunnel = require('tunnel');
const { MongoClient } = require('mongodb'); // native driver
const mongoose = require('mongoose');
const { URL } = require('url');

const uri = process.env.MONGODB_URI;
const proxy = process.env.QUOTAGUARDSTATIC_URL;

if (!uri || !proxy) {
  console.error('❌ Missing Mongo URI or Proxy');
  process.exit(1);
}

const proxyUri = new URL(proxy);

const agent = tunnel.httpsOverHttp({
  proxy: {
    host: proxyUri.hostname,
    port: parseInt(proxyUri.port),
    proxyAuth: `${proxyUri.username}:${proxyUri.password}`
  }
});

// Workaround: Connect with native driver first using proxy
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  agent
});

client.connect()
  .then(() => {
    console.log('✅ Native MongoClient connected via proxy');

    // Use Mongoose with already-open native connection
    return mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  })
  .then(() => {
    console.log('✅ Mongoose reconnected successfully');
  })
  .catch(err => {
    console.error('❌ Connection Error:', err);
    process.exit(1);
  });
