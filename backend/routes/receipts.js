const express = require('express');
const router = express.Router();
const {
  uploadReceipt, getReceipts, getReceipt, updateReceipt, deleteReceipt
} = require('../controllers/receiptController');
const protect = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/')
  .get(getReceipts)
  .post(upload.single('receiptFile'), uploadReceipt);

router.route('/:id')
  .get(getReceipt)
  .put(upload.single('receiptFile'), updateReceipt)
  .delete(deleteReceipt);

module.exports = router;
