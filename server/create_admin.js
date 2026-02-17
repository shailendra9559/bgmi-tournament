const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

const createAdmin = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB Connected');

        const newAdmin = {
            username: 'SuperAdmin',
            email: 'superadmin@bgmi.com',
            password: 'SuperAdmin@123',
            role: 'admin', // Or 'superadmin' if schema supports it
            wallet_balance: 10000
        };

        // Check if user exists
        const existingUser = await User.findOne({ email: newAdmin.email });
        if (existingUser) {
            console.log('⚠️ User already exists. Updating password...');
            existingUser.password = newAdmin.password;
            if (existingUser.role !== 'admin') existingUser.role = 'admin';
            await existingUser.save();
            console.log('✅ Updated existing user to Admin.');
        } else {
            const user = await User.create(newAdmin);
            console.log('✅ New Admin User Created:', user.email);
        }

        process.exit();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

createAdmin();
