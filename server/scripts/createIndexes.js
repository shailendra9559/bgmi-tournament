require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
const Transaction = require('../models/Transaction');
const Article = require('../models/Article');

async function createIndexes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        console.log('Creating User indexes...');
        await User.collection.createIndex({ username: 1 }, { unique: true });
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ referralCode: 1 }, { unique: true });

        console.log('Creating Match indexes...');
        await Match.collection.createIndex({ status: 1 });
        await Match.collection.createIndex({ match_time: 1 });

        console.log('Creating Transaction indexes...');
        await Transaction.collection.createIndex({ user: 1 });
        await Transaction.collection.createIndex({ status: 1 });
        await Transaction.collection.createIndex({ razorpay_order_id: 1 });

        console.log('Creating Article indexes...');
        await Article.collection.createIndex({ status: 1 });
        await Article.collection.createIndex({ slug: 1 }, { unique: true });

        console.log('✅ All indexes created successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        process.exit(1);
    }
}

createIndexes();
