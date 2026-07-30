const Receipt = require('../models/Receipt');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Send upload confirmation email
const sendUploadConfirmationEmail = async (user, receipt) => {
  try {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') return;
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    await transporter.sendMail({
      from: `"Rent Receipt Manager" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: `Receipt Uploaded: ${receipt.month} ${receipt.year}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #6366f1;">Receipt Uploaded Successfully!</h2>
          <p>Dear ${user.name},</p>
          <p>Your rent receipt has been uploaded successfully.</p>
          <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Month</b></td><td style="padding: 8px; border: 1px solid #ddd;">${receipt.month} ${receipt.year}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Amount</b></td><td style="padding: 8px; border: 1px solid #ddd;">₹${receipt.amount}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Payment Method</b></td><td style="padding: 8px; border: 1px solid #ddd;">${receipt.paymentMethod}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Landlord</b></td><td style="padding: 8px; border: 1px solid #ddd;">${receipt.landlordName}</td></tr>
          </table>
          <p style="margin-top: 16px;">Reminder: Your next rent is due next month!</p>
        </div>
      `
    });
  } catch (err) {
    console.log('Email sending failed (non-critical):', err.message);
  }
};

// @desc    Upload a new receipt
// @route   POST /api/receipts
// @access  Private
exports.uploadReceipt = async (req, res) => {
  try {
    const {
      tenantName, month, year,
      amount, paymentMethod, paymentDate, notes
    } = req.body;

    const receiptData = {
      userId: req.user._id,
      tenantName,
      landlordName: '',
      flatNumber: '',
      month,
      year: parseInt(year),
      amount: parseFloat(amount),
      paymentMethod,
      paymentDate: new Date(paymentDate),
      notes
    };

    if (req.file) {
      receiptData.receiptFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      };
    }

    const receipt = await Receipt.create(receiptData);

    // Send email confirmation (non-blocking)
    sendUploadConfirmationEmail(req.user, receipt);

    res.status(201).json({
      success: true,
      message: 'Receipt uploaded successfully',
      receipt: { ...receipt.toJSON(), fileUrl: receipt.fileUrl }
    });
  } catch (error) {
    // Delete uploaded file if DB save failed
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all receipts for current user
// @route   GET /api/receipts
// @access  Private
exports.getReceipts = async (req, res) => {
  try {
    const {
      page = 1, limit = 10, search, month, year,
      paymentMethod, minAmount, maxAmount, startDate, endDate,
      sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const query = { userId: req.user._id };

    if (month) query.month = month;
    if (year) query.year = parseInt(year);
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { tenantName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [receipts, total] = await Promise.all([
      Receipt.find(query).sort(sortObj).skip(skip).limit(parseInt(limit)),
      Receipt.countDocuments(query)
    ]);

    const receiptsWithUrl = receipts.map(r => ({ ...r.toJSON(), fileUrl: r.fileUrl }));

    res.json({
      success: true,
      count: receiptsWithUrl.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      receipts: receiptsWithUrl
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single receipt
// @route   GET /api/receipts/:id
// @access  Private
exports.getReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('reviewedBy', 'name');
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }
    res.json({ success: true, receipt: { ...receipt.toJSON(), fileUrl: receipt.fileUrl } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update receipt
// @route   PUT /api/receipts/:id
// @access  Private
exports.updateReceipt = async (req, res) => {
  try {
    let receipt = await Receipt.findOne({ _id: req.params.id, userId: req.user._id });
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    const allowedUpdates = ['tenantName', 'month', 'year',
      'amount', 'paymentMethod', 'paymentDate', 'notes'];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.file) {
      // Delete old file
      if (receipt.receiptFile && receipt.receiptFile.path) {
        fs.unlink(receipt.receiptFile.path, () => {});
      }
      updates.receiptFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      };
    }

    receipt = await Receipt.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

    res.json({
      success: true,
      message: 'Receipt updated successfully',
      receipt: { ...receipt.toJSON(), fileUrl: receipt.fileUrl }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete receipt
// @route   DELETE /api/receipts/:id
// @access  Private
exports.deleteReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findOne({ _id: req.params.id, userId: req.user._id });
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    // Delete associated file
    if (receipt.receiptFile && receipt.receiptFile.path) {
      fs.unlink(receipt.receiptFile.path, () => {});
    }

    await receipt.deleteOne();
    res.json({ success: true, message: 'Receipt deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
