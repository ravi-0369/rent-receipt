const Receipt = require('../models/Receipt');
const User = require('../models/User');
const fs = require('fs');

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    // Get receipt counts per user
    const userIds = users.map(u => u._id);
    const receiptCounts = await Receipt.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ]);
    const countMap = {};
    receiptCounts.forEach(r => { countMap[r._id.toString()] = r; });

    const usersWithStats = users.map(u => ({
      ...u.toObject(),
      receiptCount: countMap[u._id.toString()]?.count || 0,
      totalAmount: countMap[u._id.toString()]?.totalAmount || 0
    }));

    res.json({ success: true, total, totalPages: Math.ceil(total / parseInt(limit)), currentPage: parseInt(page), users: usersWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all receipts (admin)
// @route   GET /api/admin/receipts
// @access  Admin
exports.getAllReceipts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, userId, month, year, paymentMethod } = req.query;
    const query = {};
    if (userId) query.userId = userId;
    if (month) query.month = month;
    if (year) query.year = parseInt(year);
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (search) {
      query.$or = [
        { tenantName: { $regex: search, $options: 'i' } },
        { landlordName: { $regex: search, $options: 'i' } },
        { flatNumber: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [receipts, total] = await Promise.all([
      Receipt.find(query).populate('userId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Receipt.countDocuments(query)
    ]);

    const receiptsWithUrl = receipts.map(r => ({ ...r.toJSON(), fileUrl: r.fileUrl }));
    res.json({ success: true, total, totalPages: Math.ceil(total / parseInt(limit)), currentPage: parseInt(page), receipts: receiptsWithUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete any receipt (admin)
// @route   DELETE /api/admin/receipts/:id
// @access  Admin
exports.deleteReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }
    if (receipt.receiptFile && receipt.receiptFile.path) {
      fs.unlink(receipt.receiptFile.path, () => {});
    }
    await receipt.deleteOne();
    res.json({ success: true, message: 'Receipt deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deactivate / activate a user (admin)
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Admin
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot deactivate admin users' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
exports.getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalReceipts, totalAmountResult, recentReceipts, recentUsers] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Receipt.countDocuments(),
      Receipt.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Receipt.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(5),
      User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).select('-password')
    ]);

    const monthlyStats = await Receipt.aggregate([
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalReceipts,
        totalAmount: totalAmountResult[0]?.total || 0,
        recentReceipts: recentReceipts.map(r => ({ ...r.toJSON(), fileUrl: r.fileUrl })),
        recentUsers,
        monthlyStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
