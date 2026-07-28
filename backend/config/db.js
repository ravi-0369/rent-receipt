const mongoose = require('mongoose');
const dns = require('dns');

// Set public DNS servers for Windows SRV record resolution
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore DNS override errors
}

const seedInMemory = async () => {
  try {
    const User = require('../models/User');
    const Receipt = require('../models/Receipt');
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding initial sample data...');
      await User.create({ name: 'Admin User', email: 'admin@rentreceipts.com', password: 'admin123', role: 'admin' });
      const users = await User.create([
        { name: 'Rahul Sharma', email: 'rahul@example.com', password: 'user123' },
        { name: 'Priya Patel', email: 'priya@example.com', password: 'user123' }
      ]);
      const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card'];
      const receiptsToCreate = [];
      for (const user of users) {
        for (let i = 0; i < 6; i++) {
          receiptsToCreate.push({
            userId: user._id,
            tenantName: user.name,
            landlordName: 'Suresh Properties',
            flatNumber: `A-${i+1}01`,
            month: MONTHS[i],
            year: 2025,
            amount: 12000,
            paymentMethod: METHODS[i % METHODS.length],
            paymentDate: new Date(2025, i, 5),
            notes: 'Monthly rent payment',
            status: i % 2 === 0 ? 'Verified' : 'Pending'
          });
        }
      }
      await Receipt.create(receiptsToCreate);
      console.log('✓ Sample data seeded successfully');
    }
  } catch (err) {
    console.error('Auto-seed error:', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 4000
    });
    console.log(`\x1b[32m✓ MongoDB Connected: ${conn.connection.host}\x1b[0m`);
    await seedInMemory();
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

