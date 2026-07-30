const mongoose = require('mongoose');
const dns = require('dns');

// Set public DNS servers for Windows SRV record resolution
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore DNS override errors
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 4000
    });
    console.log(`\x1b[32m✓ MongoDB Connected: ${conn.connection.host}\x1b[0m`);

  } catch (error) {
    console.error(`\x1b[31m✗ Primary MongoDB Connection Error: ${error.message}\x1b[0m`);
    console.log('🔄 Starting background in-memory database setup...');
    // Non-blocking background connect
    (async () => {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create({
          binary: { version: '4.0.25' }
        });
        const uri = mongod.getUri();
        await mongoose.connect(uri);
        console.log(`\x1b[32m✓ In-Memory MongoDB Connected & Ready!\x1b[0m`);
        await seedInMemory();
      } catch (err) {
        console.error('Background DB connect error:', err.message);
      }
    })();
  }
};

module.exports = connectDB;

