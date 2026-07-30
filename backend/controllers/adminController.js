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

// @desc    Delete a user and their receipts (admin)
// @route   DELETE /api/admin/users/:id
// @access  Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete admin accounts' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    // Delete all receipts belonging to this user
    await Receipt.deleteMany({ userId: user._id });
    await user.deleteOne();
    res.json({ success: true, message: `User "${user.name}" and their receipts have been deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
exports.getAdminStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalUsers, totalReceipts, totalAmountResult, recentReceipts, recentUsers, loggedInToday, neverLoggedIn, pendingVerification] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Receipt.countDocuments(),
      Receipt.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Receipt.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(5),
      User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).select('-password'),
      User.countDocuments({ role: 'user', lastLogin: { $gte: todayStart } }),
      User.countDocuments({ role: 'user', lastLogin: null }),
      Receipt.countDocuments({ status: 'Pending' })
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
        loggedInToday,
        neverLoggedIn,
        pendingVerification,
        recentReceipts: recentReceipts.map(r => ({ ...r.toJSON(), fileUrl: r.fileUrl })),
        recentUsers,
        monthlyStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Change user role (promote/demote)
// @route   PUT /api/admin/users/:id/role
// @access  Admin
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be user or admin' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }
    user.role = role;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: `User role changed to ${role}`, role: user.role });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review receipt — Accept or Reject with admin reply
// @route   PUT /api/admin/receipts/:id/status
// @access  Admin
exports.updateReceiptStatus = async (req, res) => {
  try {
    const { status, adminReply } = req.body;
    if (!['Pending', 'Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    if (status === 'Rejected' && !adminReply?.trim()) {
      return res.status(400).json({ success: false, message: 'A reason is required when rejecting a document' });
    }

    const receipt = await Receipt.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminReply: adminReply?.trim() || null,
        reviewedAt: new Date(),
        reviewedBy: req.user._id
      },
      { new: true }
    ).populate('reviewedBy', 'name');

    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });

    res.json({
      success: true,
      message: status === 'Verified' ? '✅ Document accepted successfully' : '❌ Document rejected',
      receipt: { ...receipt.toJSON(), fileUrl: receipt.fileUrl }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get verification queue (filterable by status) with status-count aggregation
// @route   GET /api/admin/verify
// @access  Admin
exports.getVerificationQueue = async (req, res) => {
  try {
    const { page = 1, limit = 15, status, search } = req.query;
    const query = {};
    if (status && ['Pending', 'Verified', 'Rejected'].includes(status)) query.status = status;
    if (search) {
      query.$or = [
        { tenantName: { $regex: search, $options: 'i' } },
        { landlordName: { $regex: search, $options: 'i' } },
        { flatNumber: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [receipts, total, statusCounts] = await Promise.all([
      Receipt.find(query)
        .populate('userId', 'name email')
        .populate('reviewedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Receipt.countDocuments(query),
      Receipt.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    // Count verified docs from today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const verifiedToday = await Receipt.countDocuments({
      status: 'Verified',
      reviewedAt: { $gte: todayStart }
    });

    // Build counts map
    const counts = { Pending: 0, Verified: 0, Rejected: 0, All: 0 };
    statusCounts.forEach(s => {
      counts[s._id] = s.count;
      counts.All += s.count;
    });

    const receiptsWithUrl = receipts.map(r => ({ ...r.toJSON(), fileUrl: r.fileUrl }));

    res.json({
      success: true,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      receipts: receiptsWithUrl,
      counts,
      verifiedToday
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk update receipt statuses (accept or reject multiple at once)
// @route   PUT /api/admin/verify/bulk
// @access  Admin
exports.bulkUpdateReceiptStatus = async (req, res) => {
  try {
    const { ids, status, adminReply } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No receipt IDs provided' });
    }
    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Verified or Rejected' });
    }
    if (status === 'Rejected' && !adminReply?.trim()) {
      return res.status(400).json({ success: false, message: 'A reason is required when bulk rejecting documents' });
    }

    const result = await Receipt.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          status,
          adminReply: adminReply?.trim() || (status === 'Verified' ? 'Your document has been verified and accepted.' : null),
          reviewedAt: new Date(),
          reviewedBy: req.user._id
        }
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} document(s) ${status === 'Verified' ? 'approved' : 'rejected'} successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
