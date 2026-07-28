const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Receipt = require('../models/Receipt');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card'];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Receipt.deleteMany({});
    console.log('✓ Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@rentreceipts.com',
      password: 'admin123',
      role: 'admin'
    });

    // Create regular users
    const users = await User.create([
      { name: 'Rahul Sharma', email: 'rahul@example.com', password: 'user123' },
      { name: 'Priya Patel', email: 'priya@example.com', password: 'user123' },
      { name: 'Amit Kumar', email: 'amit@example.com', password: 'user123' }
    ]);

    console.log('✓ Created users');

    // Create sample receipts for each user
    const receiptsToCreate = [];
    for (const user of users) {
      for (let i = 0; i < 8; i++) {
        const monthIdx = i % 12;
        receiptsToCreate.push({
          userId: user._id,
          tenantName: user.name,
          landlordName: 'Suresh Properties',
          flatNumber: `A-${Math.floor(Math.random() * 20) + 1}0${Math.floor(Math.random() * 9) + 1}`,
          month: MONTHS[monthIdx],
          year: monthIdx < 6 ? 2025 : 2024,
          amount: 8000 + Math.floor(Math.random() * 7000),
          paymentMethod: METHODS[Math.floor(Math.random() * METHODS.length)],
          paymentDate: new Date(2025, monthIdx, Math.floor(Math.random() * 25) + 1),
          notes: 'Monthly rent payment',
          status: ['Pending', 'Verified'][Math.floor(Math.random() * 2)]
        });
      }
    }

    await Receipt.create(receiptsToCreate);
    console.log('✓ Created sample receipts');
    console.log('\n==========================================');
    console.log('  SAMPLE LOGIN CREDENTIALS');
    console.log('==========================================');
    console.log('  Admin:   admin@rentreceipts.com / admin123');
    console.log('  User 1:  rahul@example.com / user123');
    console.log('  User 2:  priya@example.com / user123');
    console.log('  User 3:  amit@example.com / user123');
    console.log('==========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedData();
