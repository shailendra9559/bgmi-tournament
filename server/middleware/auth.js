const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        let token = req.headers.authorization?.split(' ')[1] || req.headers['x-auth-token'];
        if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        if (!req.user) return res.status(401).json({ message: 'User not found' });

        next();
    } catch (error) {
        res.status(401).json({ message: 'Token invalid or expired' });
    }
};

exports.adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};
