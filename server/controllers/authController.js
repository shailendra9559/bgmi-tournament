const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    });
    const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });
    return { accessToken, refreshToken };
};

// Register
exports.register = async (req, res) => {
    try {
        const { username, email, password, phone, referralCode } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const exists = await User.findOne({ $or: [{ email }, { username }] });
        if (exists) return res.status(400).json({ message: 'User already exists' });

        let referrer = null;
        if (referralCode) {
            referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
        }

        const user = await User.create({
            username, email, password, phone,
            referredBy: referrer?._id
        });

        if (referrer) {
            referrer.bonus_balance += 10;
            await referrer.save();
        }

        const tokens = generateTokens(user._id);
        res.status(201).json({
            user: { id: user._id, username, email, role: user.role, wallet_balance: 0 },
            ...tokens
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');

        if (!user || !user.password) {
            console.log(`Login failed for email: ${email}`);
            return res.status(401).json({ message: `Invalid credentials for: "${email}"` });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log(`Password mismatch for email: ${email}`);
            return res.status(401).json({ message: `Invalid credentials for: "${email}"` });
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: 'Account is blocked' });
        }

        user.lastLogin = new Date();
        await user.save();

        const tokens = generateTokens(user._id);
        res.json({
            user: { id: user._id, username: user.username, email: user.email, role: user.role, wallet_balance: user.wallet_balance },
            ...tokens
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Profile
exports.updateProfile = async (req, res) => {
    try {
        const { bgmi_id, bgmi_name, phone } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { bgmi_id, bgmi_name, phone },
            { new: true }
        );
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const tokens = generateTokens(decoded.id);
        res.json(tokens);
    } catch (error) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};
