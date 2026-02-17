const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

const deleteOldAdmin = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB Connected');

        const emailToDelete = 'admin@bgmi.com';

        const result = await User.deleteOne({ email: emailToDelete });

        if (result.deletedCount > 0) {
            console.log(`✅ Successfully deleted user: ${emailToDelete}`);
        } else {
            console.log(`⚠️ User not found: ${emailToDelete}`);
        }

        process.exit();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

deleteOldAdmin();
