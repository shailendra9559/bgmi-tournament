const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
        type: String,
        enum: ['deposit', 'withdrawal', 'entry_fee', 'winnings', 'refund', 'bonus', 'referral'],
        required: true
    },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'rejected'],
        default: 'pending'
    },
    transaction_id: { type: String }, // User's UPI transaction ID
    admin_notes: { type: String }, // Admin verification notes
    razorpay_order_id: { type: String, index: true },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },
    withdrawal_upi_id: { type: String },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    description: { type: String },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date },
    failureReason: { type: String }
}, { timestamps: true });

TransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
