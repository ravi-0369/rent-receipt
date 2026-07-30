const express = require('express');
const router = express.Router();
const {
  getAllUsers, getAllReceipts, deleteReceipt, toggleUserStatus, getAdminStats,
  changeUserRole, updateReceiptStatus, deleteUser,
  getVerificationQueue, bulkUpdateReceiptStatus
} = require('../controllers/adminController');
const protect = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.use(protect, isAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.put('/users/:id/role', changeUserRole);
router.delete('/users/:id', deleteUser);
router.get('/receipts', getAllReceipts);
router.delete('/receipts/:id', deleteReceipt);
router.put('/receipts/:id/status', updateReceiptStatus);

// Verification queue routes
router.get('/verify', getVerificationQueue);
router.put('/verify/bulk', bulkUpdateReceiptStatus);

module.exports = router;
