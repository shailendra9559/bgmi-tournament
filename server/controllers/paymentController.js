const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Order
exports.createOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        if (amount < 10) return res.status(400).json({ message: 'Minimum deposit is ₹10' });

        const options = {
            amount: amount * 100,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        await Transaction.create({
            user: req.user.id,
            type: 'deposit',
            amount,
            razorpay_order_id: order.id,
            status: 'pending'
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid signature' });
        }

        // Atomic update to ensure idempotency
        // We find the transaction that matches the order_id AND is still 'pending'
        // If it's already completed, this will return null, preventing double-credit.
        const transaction = await Transaction.findOneAndUpdate(
            { razorpay_order_id, status: 'pending' },
            {
                razorpay_payment_id,
                razorpay_signature,
                status: 'completed'
            },
            { new: true }
        );

        if (!transaction) {
            // Check if it was already completed to give a better error message
            const existing = await Transaction.findOne({ razorpay_order_id });
            if (existing && existing.status === 'completed') {
                return res.status(200).json({ message: 'Payment already verified', balance: existing.amount }); // Return success for retry
            }
            return res.status(404).json({ message: 'Transaction not found or already processed' });
        }

        // Add to user balance atomically
        const user = await User.findByIdAndUpdate(
            transaction.user,
            {
                $inc: {
                    wallet_balance: transaction.amount,
                    total_deposited: transaction.amount
                }
            },
            { new: true }
        );

        res.json({ message: 'Payment successful', balance: user.wallet_balance });
    } catch (error) {
        console.error('Payment Verification Error:', error);
        res.status(500).json({ message: 'Internal server error during payment verification' });
    }
};

// Request Withdrawal
exports.requestWithdrawal = async (req, res) => {
    try {
        const { amount, upi_id } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);

        if (user.kycStatus !== 'verified') {
            return res.status(400).json({ message: 'KYC verification required for withdrawal' });
        }
        if (amount < 100) return res.status(400).json({ message: 'Minimum withdrawal is ₹100' });

        // Atomic check and update to prevent race limit
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId, wallet_balance: { $gte: amount } },
            { $inc: { wallet_balance: -amount } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        await Transaction.create({
            user: userId,
            type: 'withdrawal',
            amount,
            withdrawal_upi_id: upi_id || user.kycDocuments?.upiId,
            status: 'pending',
            description: 'Withdrawal request'
        });

        res.json({ message: 'Withdrawal request submitted', balance: updatedUser.wallet_balance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add Money Demo - REMOVED FOR SECURITY
exports.addMoneyDemo = async (req, res) => {
    return res.status(410).json({ message: 'This endpoint is no longer available.' });
};

// Get Transactions
exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
