const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
    title: { type: String, required: true },
    map: { type: String, enum: ['Erangel', 'Miramar', 'Sanhok', 'Livik', 'Vikendi'], default: 'Erangel' },
    type: { type: String, enum: ['Solo', 'Duo', 'Squad'], default: 'Squad' },
    entry_fee: { type: Number, required: true },
    prize_pool: { type: Number, required: true },
    per_kill: { type: Number, default: 10 },
    max_participants: { type: Number, default: 100 },
    match_time: { type: Date, required: true },
    room_id: { type: String, default: '' },
    room_password: { type: String, default: '' },
    status: { type: String, enum: ['upcoming', 'live', 'completed', 'cancelled'], default: 'upcoming' },
    participants: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        bgmi_name: String,
        joinedAt: { type: Date, default: Date.now }
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Match', MatchSchema);
