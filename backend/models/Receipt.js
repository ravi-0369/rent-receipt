const mongoose = require('mongoose');

const ReceiptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenantName: {
    type: String,
    required: [true, 'Tenant name is required'],
    trim: true
  },
  landlordName: {
    type: String,
    trim: true,
    default: ''
  },
  flatNumber: {
    type: String,
    trim: true,
    default: ''
  },
  month: {
    type: String,
    required: [true, 'Month is required']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2000, 'Year must be 2000 or later'],
    max: [2100, 'Year must be 2100 or earlier']
  },
  amount: {
    type: Number,
    required: [true, 'Rent amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Card']
  },
  paymentDate: {
    type: Date,
    required: [true, 'Payment date is required']
  },
  receiptFile: {
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending'
  },
  adminReply: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin reply cannot exceed 1000 characters'],
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }

}, {
  timestamps: true
});

// Index for faster queries
ReceiptSchema.index({ userId: 1, year: -1, month: 1 });
ReceiptSchema.index({ userId: 1, createdAt: -1 });

// Virtual for file URL
ReceiptSchema.virtual('fileUrl').get(function () {
  if (this.receiptFile && this.receiptFile.filename) {
    return `/uploads/${this.receiptFile.filename}`;
  }
  return null;
});

ReceiptSchema.set('toJSON', { virtuals: true });
ReceiptSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Receipt', ReceiptSchema);
