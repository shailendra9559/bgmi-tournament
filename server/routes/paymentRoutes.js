const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-order', protect, paymentController.createOrder);
router.post('/verify', protect, paymentController.verifyPayment);
router.post('/withdraw', protect, paymentController.requestWithdrawal);
router.post('/add-demo', protect, paymentController.addMoneyDemo);
router.get('/history', protect, paymentController.getTransactions);

module.exports = router;
