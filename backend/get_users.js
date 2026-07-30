require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

async function fetchUsers() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('--- CONNECTED TO MONGODB ---');
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('TOTAL USERS IN DATABASE:', users.length);
    users.forEach(u => {
      console.log('----------------------------------------');
      console.log('ID:        ', u._id.toString());
      console.log('Name:      ', u.name);
      console.log('Email:     ', u.email);
      console.log('Role:      ', u.role);
      console.log('Active:    ', u.isActive);
      console.log('Last Login:', u.lastLogin ? u.lastLogin.toISOString() : 'Never / Not recorded');
      console.log('Created At:', u.createdAt ? u.createdAt.toISOString() : 'N/A');
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error fetching users:', err.message);
  }
}

fetchUsers();

