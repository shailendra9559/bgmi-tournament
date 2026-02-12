const Match = require('../models/Match');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get All Matches (public — only upcoming/live, hides room credentials)
exports.getMatches = async (req, res) => {
    try {
        const matches = await Match.find({ status: { $in: ['upcoming', 'live'] } })
            .sort({ match_time: 1 })
            .populate('participants.user', 'username');

        const sanitizedMatches = matches.map(match => {
            const timeDiff = new Date(match.match_time) - new Date();
            const minutesLeft = Math.floor(timeDiff / 1000 / 60);
            return {
                ...match._doc,
                room_id: minutesLeft <= 15 ? match.room_id : 'Hidden',
                room_password: minutesLeft <= 15 ? match.room_password : 'Hidden',
                participantCount: match.participants.length
            };
        });
        res.json(sanitizedMatches);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Get ALL matches for admin (includes completed/cancelled)
exports.getAllMatches = async (req, res) => {
    try {
        const matches = await Match.find()
            .sort({ createdAt: -1 })
            .populate('participants.user', 'username email bgmi_name wallet_balance')
            .populate('createdBy', 'username');
        const result = matches.map(m => ({
            ...m._doc,
            participantCount: m.participants.length
        }));
        res.json(result);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Get Single Match
exports.getMatch = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate('participants.user', 'username bgmi_name');
        if (!match) return res.status(404).json({ message: 'Match not found' });
        res.json(match);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Join Match
exports.joinMatch = async (req, res) => {
    try {
        const { matchId, bgmi_name } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        const match = await Match.findById(matchId);

        if (!match) return res.status(404).json({ message: 'Match not found' });
        if (match.status !== 'upcoming') return res.status(400).json({ message: 'Match is not open for joining' });
        if (match.participants.length >= match.max_participants) return res.status(400).json({ message: 'Match is full' });

        const alreadyJoined = match.participants.some(p => p.user.toString() === userId);
        if (alreadyJoined) return res.status(400).json({ message: 'Already joined this match' });
        if (user.wallet_balance < match.entry_fee) return res.status(400).json({ message: 'Insufficient balance' });

        // Deduct balance
        user.wallet_balance -= match.entry_fee;
        user.matches_played.push(matchId);
        await user.save();

        // Add to match
        match.participants.push({ user: userId, bgmi_name: bgmi_name || user.bgmi_name });
        await match.save();

        // Create transaction
        await Transaction.create({
            user: userId, type: 'entry_fee', amount: match.entry_fee,
            status: 'completed', match: matchId,
            description: `Entry fee for ${match.title}`
        });

        // Emit socket event
        const socketHandler = req.app.get('socketHandler');
        if (socketHandler) {
            socketHandler.emitParticipantJoined(matchId, {
                userId, bgmi_name: bgmi_name || user.bgmi_name,
                count: match.participants.length
            });
        }

        res.json({ message: 'Joined successfully!', balance: user.wallet_balance, participantCount: match.participants.length });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Create Match (Admin)
exports.createMatch = async (req, res) => {
    try {
        const { title, map, type, entry_fee, prize_pool, per_kill, max_participants, match_time } = req.body;
        const match = await Match.create({
            title, map, type, entry_fee, prize_pool, per_kill, max_participants, match_time,
            createdBy: req.user.id
        });
        res.status(201).json(match);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Update Match (Admin) — whitelist fields
exports.updateMatch = async (req, res) => {
    try {
        const allowed = ['title', 'map', 'type', 'entry_fee', 'prize_pool', 'per_kill',
            'max_participants', 'match_time', 'room_id', 'room_password', 'status'];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        const match = await Match.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!match) return res.status(404).json({ message: 'Match not found' });

        // If room credentials updated, emit to participants
        if (updates.room_id || updates.room_password) {
            const socketHandler = req.app.get('socketHandler');
            if (socketHandler) {
                socketHandler.emitRoomCredentials(req.params.id, match.room_id, match.room_password);
            }
        }
        res.json(match);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Delete Match (Admin) — refunds participants if match had entry fees
exports.deleteMatch = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ message: 'Match not found' });

        // If match has participants who paid, refund them
        if (match.participants.length > 0 && match.entry_fee > 0 && match.status !== 'completed') {
            for (const participant of match.participants) {
                const user = await User.findById(participant.user);
                if (user) {
                    user.wallet_balance += match.entry_fee;
                    await user.save();
                    await Transaction.create({
                        user: participant.user, type: 'refund', amount: match.entry_fee,
                        status: 'completed', match: match._id,
                        description: `Refund: "${match.title}" was deleted by admin`
                    });
                }
            }
        }

        await Match.findByIdAndDelete(req.params.id);
        // Also clean up related transactions
        await Transaction.updateMany(
            { match: req.params.id, type: 'entry_fee', status: 'completed' },
            { $set: { description: `Entry fee for "${match.title}" (match deleted, refunded)` } }
        );

        const refundCount = match.entry_fee > 0 && match.status !== 'completed' ? match.participants.length : 0;
        res.json({
            message: `Match deleted.${refundCount > 0 ? ` ₹${match.entry_fee} refunded to ${refundCount} participant(s).` : ''}`,
            refundedCount: refundCount,
            refundedAmount: refundCount * match.entry_fee
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Change Match Status (Admin) — with refunds on cancel
exports.changeMatchStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['upcoming', 'live', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Status must be: ${validStatuses.join(', ')}` });
        }

        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ message: 'Match not found' });

        const oldStatus = match.status;

        // If cancelling, refund all participants
        if (status === 'cancelled' && oldStatus !== 'cancelled' && oldStatus !== 'completed') {
            if (match.participants.length > 0 && match.entry_fee > 0) {
                for (const participant of match.participants) {
                    const user = await User.findById(participant.user);
                    if (user) {
                        user.wallet_balance += match.entry_fee;
                        await user.save();
                        await Transaction.create({
                            user: participant.user, type: 'refund', amount: match.entry_fee,
                            status: 'completed', match: match._id,
                            description: `Refund: "${match.title}" was cancelled`
                        });
                    }
                }
            }
        }

        match.status = status;
        await match.save();

        // Socket notification
        const socketHandler = req.app.get('socketHandler');
        if (socketHandler) {
            socketHandler.emitMatchUpdate(req.params.id, { status, title: match.title });
        }

        const refundMsg = status === 'cancelled' && match.participants.length > 0 && match.entry_fee > 0
            ? ` ₹${match.entry_fee} refunded to ${match.participants.length} participant(s).`
            : '';

        res.json({ message: `Status changed: ${oldStatus} → ${status}.${refundMsg}`, match });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Remove participant from match (Admin) — with refund
exports.removeParticipant = async (req, res) => {
    try {
        const { matchId, userId } = req.params;
        const match = await Match.findById(matchId);
        if (!match) return res.status(404).json({ message: 'Match not found' });

        const participantIndex = match.participants.findIndex(p => p.user.toString() === userId);
        if (participantIndex === -1) return res.status(404).json({ message: 'Participant not in this match' });

        match.participants.splice(participantIndex, 1);
        await match.save();

        // Refund if match hasn't completed
        if (match.status !== 'completed' && match.entry_fee > 0) {
            const user = await User.findById(userId);
            if (user) {
                user.wallet_balance += match.entry_fee;
                await user.save();
                await Transaction.create({
                    user: userId, type: 'refund', amount: match.entry_fee,
                    status: 'completed', match: matchId,
                    description: `Refund: removed from "${match.title}" by admin`
                });
            }
        }

        res.json({ message: 'Participant removed and refunded', participantCount: match.participants.length });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Get My Matches
exports.getMyMatches = async (req, res) => {
    try {
        const matches = await Match.find({ 'participants.user': req.user.id })
            .sort({ match_time: -1 });
        res.json(matches);
    } catch (err) { res.status(500).json({ message: err.message }); }
};
