const express = require('express');
const router = express.Router();
const {
  getAllUsers, getAllReceipts, deleteReceipt, toggleUserStatus, getAdminStats
} = require('../controllers/adminController');
const protect = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.use(protect, isAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/receipts', getAllReceipts);
router.delete('/receipts/:id', deleteReceipt);

module.exports = router;
