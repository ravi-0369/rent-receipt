const User = require('../models/User');
const nodemailer = require('nodemailer');

// Configure nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  try {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') return;
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Rent Receipt Manager" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: 'Welcome to Rent Receipt Manager!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Welcome, ${user.name}!</h2>
          <p>Your account has been successfully created on Rent Receipt Manager.</p>
          <p>You can now start uploading and managing your rent receipts securely.</p>
          <br/>
          <p>Best regards,<br/>The Rent Receipt Manager Team</p>
        </div>
      `
    });
  } catch (err) {
    console.log('Email sending failed (non-critical):', err.message);
  }
};

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Only allow admin role if explicitly set and env allows it
    const userRole = (role === 'admin' && process.env.NODE_ENV === 'development') ? 'admin' : 'user';

    const user = await User.create({ name, email, password, role: userRole });
    const token = user.getSignedJwtToken();

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = user.getSignedJwtToken();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Profile updated', user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    const token = user.getSignedJwtToken();
    res.json({ success: true, message: 'Password changed successfully', token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
