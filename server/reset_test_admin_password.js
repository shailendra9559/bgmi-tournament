const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

// Force connection to 'test' database
const uri = process.env.MONGO_URI.replace('/bgmi_tournament', '/test');
console.log('Connecting to TEST DB:', uri.replace(/:([^:@]+)@/, ':****@'));

mongoose.connect(uri)
    .then(async () => {
        console.log('Connected to TEST DB');

        try {
            const user = await User.findOne({ email: 'admin@bgmi.com' });

            if (!user) {
                console.log('User admin@bgmi.com NOT FOUND in TEST DB!');
                // Create it if missing?
                // For now, exit
                process.exit(1);
            }

            console.log('Found user in TEST DB:', user.email, 'ID:', user._id);

            // Set new password
            user.password = 'Admin@123';
            await user.save();

            console.log('Password updated successfully for admin@bgmi.com in TEST DB');
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
