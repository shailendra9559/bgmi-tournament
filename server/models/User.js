const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false },
    phone: { type: String, sparse: true },

    // OAuth
    googleId: { type: String, unique: true, sparse: true },
    profilePicture: { type: String, default: '' },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },

    // Gaming Info
    bgmi_id: { type: String },
    bgmi_name: { type: String },

    // Wallet
    wallet_balance: { type: Number, default: 0, min: 0 },
    bonus_balance: { type: Number, default: 0, min: 0 },
    total_winnings: { type: Number, default: 0 },
    total_deposited: { type: Number, default: 0 },

    // KYC
    kycStatus: {
        type: String,
        enum: ['not_submitted', 'pending', 'verified', 'rejected'],
        default: 'not_submitted'
    },
    kycDocuments: {
        panCard: String,
        aadharCard: String,
        upiId: String
    },

    // Referral
    referralCode: { type: String, unique: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    referralEarnings: { type: Number, default: 0 },

    // Security
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    lastLogin: { type: Date },

    // Stats
    matches_played: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
    total_kills: { type: Number, default: 0 },
    total_wins: { type: Number, default: 0 }

}, { timestamps: true });

// Hash password
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Generate referral code
UserSchema.pre('save', function (next) {
    if (!this.referralCode) {
        this.referralCode = this.username.toUpperCase().slice(0, 4) +
            Math.random().toString(36).substring(2, 6).toUpperCase();
    }
    next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
