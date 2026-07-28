const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim()) 
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Allow origin in production
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/receipts', require('./routes/receipts'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Rent Receipt API is running', timestamp: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File size exceeds 10MB limit' });
  }
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ success: false, message: 'Only PDF, JPG, JPEG, and PNG files are allowed' });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\x1b[32m✓ Server running on port ${PORT} in ${process.env.NODE_ENV} mode\x1b[0m`);
  console.log(`\x1b[34m  API: http://localhost:${PORT}/api\x1b[0m`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`\x1b[31m✗ Unhandled Rejection: ${err.message}\x1b[0m`);
});

module.exports = app;
