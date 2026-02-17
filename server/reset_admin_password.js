const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');

        try {
            const user = await User.findOne({ email: 'admin@bgmi.com' });

            if (!user) {
                console.log('User admin@bgmi.com NOT FOUND!');
                process.exit(1);
            }

            console.log('Found user:', user.email, 'ID:', user._id);
            console.log('Old Password Hash:', user.password);

            // Set new password (will be hashed by pre-save hook)
            user.password = 'Admin@123';
            await user.save();

            console.log('Password updated successfully for admin@bgmi.com');
            process.exit(0);
        } catch (err) {
            console.error('Error updating password:', err);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('DB Connection Error:', err);
        process.exit(1);
    });
