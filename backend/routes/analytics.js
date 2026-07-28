const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getYearlyStats, getMonthlyTrend, getPaymentMethodStats
} = require('../controllers/analyticsController');
const protect = require('../middleware/auth');

router.use(protect);
router.get('/dashboard', getDashboardStats);
router.get('/yearly', getYearlyStats);
router.get('/monthly-trend', getMonthlyTrend);
router.get('/payment-methods', getPaymentMethodStats);

module.exports = router;
