const Settings = require('../models/Settings');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Get UPI settings
exports.getSettings = async (req, res) => {
    try {
        const upiSettings = await Settings.findOne({ key: 'upi_settings' });
        res.json(upiSettings?.value || { upi_id: '', qr_code: '', min_deposit: 10 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update UPI settings (Admin only)
exports.updateSettings = async (req, res) => {
    try {
        const { upi_id, qr_code, min_deposit } = req.body;

        const settings = await Settings.findOneAndUpdate(
            { key: 'upi_settings' },
            {
                value: { upi_id, qr_code, min_deposit: min_deposit || 10 },
                updatedBy: req.user._id
            },
            { upsert: true, new: true }
        );

        res.json({ message: 'Settings updated', settings: settings.value });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get pending deposits (Admin only)
exports.getPendingDeposits = async (req, res) => {
    try {
        const deposits = await Transaction.find({
            type: 'deposit',
            status: 'pending',
            transaction_id: { $exists: true, $ne: '' }
        })
            .populate('user', 'username email phone')
            .sort({ createdAt: -1 });

        res.json(deposits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Verify deposit (Admin only)
exports.verifyDeposit = async (req, res) => {
    try {
        const { transactionId, action, notes } = req.body;

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.status !== 'pending') {
            return res.status(400).json({ message: 'Transaction already processed' });
        }

        transaction.admin_notes = notes || '';

        if (action === 'approve') {
            transaction.status = 'completed';

            // Add money to user wallet
            const user = await User.findById(transaction.user);
            user.wallet_balance += transaction.amount;
            user.total_deposited += transaction.amount;
            await user.save();

            await transaction.save();
            res.json({ message: `₹${transaction.amount} added to user wallet` });
        } else {
            transaction.status = 'rejected';
            await transaction.save();
            res.json({ message: 'Deposit rejected' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// User submit deposit request
exports.submitDeposit = async (req, res) => {
    try {
        const { amount, transaction_id } = req.body;

        if (!amount || amount < 10) {
            return res.status(400).json({ message: 'Minimum deposit is ₹10' });
        }

        if (!transaction_id || transaction_id.trim().length < 5) {
            return res.status(400).json({ message: 'Please enter valid transaction ID' });
        }

        // Check if transaction ID already used
        const existing = await Transaction.findOne({ transaction_id: transaction_id.trim() });
        if (existing) {
            return res.status(400).json({ message: 'This transaction ID is already used' });
        }

        const deposit = await Transaction.create({
            user: req.user._id,
            type: 'deposit',
            amount,
            transaction_id: transaction_id.trim(),
            status: 'pending',
            description: 'UPI deposit pending verification'
        });

        res.json({ message: 'Deposit submitted! Awaiting admin verification.', deposit });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create user (Admin only)
exports.createUser = async (req, res) => {
    try {
        const { username, email, password, role, wallet_balance } = req.body;

        const exists = await User.findOne({ $or: [{ email }, { username }] });
        if (exists) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        const user = await User.create({
            username, email, password,
            role: role || 'user',
            wallet_balance: wallet_balance || 0
        });

        res.status(201).json({ message: 'User created', user: { id: user._id, username, email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'admin' || user.role === 'superadmin') {
            return res.status(400).json({ message: 'Cannot delete admin users' });
        }

        await User.findByIdAndDelete(userId);
        await Transaction.deleteMany({ user: userId });

        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update user wallet (Admin only)
exports.updateUserWallet = async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount, action } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (action === 'add') {
            user.wallet_balance += amount;
        } else if (action === 'set') {
            user.wallet_balance = amount;
        }

        await user.save();
        res.json({ message: `Wallet updated to ₹${user.wallet_balance}`, balance: user.wallet_balance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
