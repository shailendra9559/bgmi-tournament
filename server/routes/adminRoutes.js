const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// Public - get UPI settings for wallet page
router.get('/settings', adminController.getSettings);

// Admin routes
router.put('/settings', protect, adminOnly, adminController.updateSettings);
router.get('/deposits/pending', protect, adminOnly, adminController.getPendingDeposits);
router.post('/deposits/verify', protect, adminOnly, adminController.verifyDeposit);

// User route - submit deposit
router.post('/deposits/submit', protect, adminController.submitDeposit);

// User management (Admin only)
router.get('/users', protect, adminOnly, adminController.getAllUsers);
router.post('/users/create', protect, adminOnly, adminController.createUser);
router.delete('/users/:userId', protect, adminOnly, adminController.deleteUser);
router.put('/users/:userId/wallet', protect, adminOnly, adminController.updateUserWallet);

module.exports = router;
