const mongoose = require('mongoose');

const MatchResultSchema = new mongoose.Schema({
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kills: { type: Number, default: 0 },
    position: { type: Number },
    isWinner: { type: Boolean, default: false },
    positionPrize: { type: Number, default: 0 },
    killPrize: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    screenshotUrl: { type: String },
    verifiedByAdmin: { type: Boolean, default: false }
}, { timestamps: true });

MatchResultSchema.index({ match: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('MatchResult', MatchResultSchema);
