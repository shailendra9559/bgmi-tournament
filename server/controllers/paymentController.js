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

        const transaction = await Transaction.findOne({ razorpay_order_id });
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

        transaction.razorpay_payment_id = razorpay_payment_id;
        transaction.razorpay_signature = razorpay_signature;
        transaction.status = 'completed';
        await transaction.save();

        const user = await User.findById(transaction.user);
        user.wallet_balance += transaction.amount;
        user.total_deposited += transaction.amount;
        await user.save();

        res.json({ message: 'Payment successful', balance: user.wallet_balance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Request Withdrawal
exports.requestWithdrawal = async (req, res) => {
    try {
        const { amount, upi_id } = req.body;
        const user = await User.findById(req.user.id);

        if (user.kycStatus !== 'verified') {
            return res.status(400).json({ message: 'KYC verification required for withdrawal' });
        }
        if (amount < 100) return res.status(400).json({ message: 'Minimum withdrawal is ₹100' });
        if (user.wallet_balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        user.wallet_balance -= amount;
        await user.save();

        await Transaction.create({
            user: user._id,
            type: 'withdrawal',
            amount,
            withdrawal_upi_id: upi_id || user.kycDocuments?.upiId,
            status: 'pending',
            description: 'Withdrawal request'
        });

        res.json({ message: 'Withdrawal request submitted', balance: user.wallet_balance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add Money (Demo - for testing without Razorpay)
exports.addMoneyDemo = async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findById(req.user.id);

        user.wallet_balance += amount;
        user.total_deposited += amount;
        await user.save();

        await Transaction.create({
            user: user._id,
            type: 'deposit',
            amount,
            status: 'completed',
            description: 'Demo deposit'
        });

        res.json({ message: 'Money added', balance: user.wallet_balance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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
