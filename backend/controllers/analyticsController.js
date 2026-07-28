const mongoose = require('mongoose');
const Receipt = require('../models/Receipt');

// @desc    Get dashboard analytics for current user
// @route   GET /api/analytics/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const currentYear = new Date().getFullYear();

    const [totalReceipts, totalAmountResult, recentReceipts, monthlyThisYear] = await Promise.all([
      Receipt.countDocuments({ userId }),
      Receipt.aggregate([{ $match: { userId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Receipt.find({ userId }).sort({ createdAt: -1 }).limit(5),
      Receipt.aggregate([
        { $match: { userId, year: currentYear } },
        {
          $group: {
            _id: '$month',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // This month's rent
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const thisMonthResult = await Receipt.aggregate([
      { $match: { userId, month: currentMonth, year: currentYear } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const monthlyChartData = months.map(m => {
      const found = monthlyThisYear.find(item => item._id === m);
      return { month: m.substring(0, 3), amount: found?.totalAmount || 0, count: found?.count || 0 };
    });

    res.json({
      success: true,
      data: {
        totalReceipts,
        totalAmount: totalAmountResult[0]?.total || 0,
        thisMonthAmount: thisMonthResult[0]?.total || 0,
        recentReceipts: recentReceipts.map(r => ({ ...r.toJSON(), fileUrl: r.fileUrl })),
        monthlyChartData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get yearly analytics
// @route   GET /api/analytics/yearly
// @access  Private
exports.getYearlyStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const yearlyData = await Receipt.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$year',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': -1 } }
    ]);
    res.json({ success: true, data: yearlyData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get monthly trend for a specific year
// @route   GET /api/analytics/monthly-trend
// @access  Private
exports.getMonthlyTrend = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    const data = await Receipt.aggregate([
      { $match: { userId, year } },
      {
        $group: {
          _id: '$month',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          methods: { $addToSet: '$paymentMethod' }
        }
      }
    ]);

    const trendData = months.map(m => {
      const found = data.find(d => d._id === m);
      return {
        month: m.substring(0, 3),
        fullMonth: m,
        amount: found?.totalAmount || 0,
        count: found?.count || 0,
        methods: found?.methods || []
      };
    });

    res.json({ success: true, year, data: trendData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payment method breakdown
// @route   GET /api/analytics/payment-methods
// @access  Private
exports.getPaymentMethodStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const data = await Receipt.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
