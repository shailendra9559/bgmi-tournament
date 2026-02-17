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

        // 1. Atomic check and deduct balance
        // We do this FIRST to ensure user has potential to join
        const match = await Match.findById(matchId);
        if (!match) return res.status(404).json({ message: 'Match not found' });
        if (match.status !== 'upcoming') return res.status(400).json({ message: 'Match is not open for joining' });

        // Check if already joined (in memory check is okay here as we double check with atomic push later)
        const alreadyJoined = match.participants.some(p => p.user.toString() === userId);
        if (alreadyJoined) return res.status(400).json({ message: 'Already joined this match' });

        // Atomic balance deduction
        const user = await User.findOneAndUpdate(
            { _id: userId, wallet_balance: { $gte: match.entry_fee } },
            {
                $inc: { wallet_balance: -match.entry_fee },
                $push: { matches_played: matchId }
            },
            { new: true }
        );

        if (!user) return res.status(400).json({ message: 'Insufficient balance' });

        try {
            // 2. Atomic push to match participants
            // This prevents race condition where multiple users join at once exceeding max_participants
            const updatedMatch = await Match.findOneAndUpdate(
                {
                    _id: matchId,
                    status: 'upcoming',
                    $expr: { $lt: [{ $size: "$participants" }, "$max_participants"] } // Ensure size < max
                },
                {
                    $push: {
                        participants: {
                            user: userId,
                            bgmi_name: bgmi_name || user.bgmi_name
                        }
                    }
                },
                { new: true }
            );

            if (!updatedMatch) {
                // If match update failed (full or changed status), REFUND USER
                await User.findByIdAndUpdate(userId, {
                    $inc: { wallet_balance: match.entry_fee },
                    $pull: { matches_played: matchId }
                });
                return res.status(400).json({ message: 'Match is full or no longer available' });
            }

            // 3. Create Transaction Record
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
                    count: updatedMatch.participants.length
                });
            }

            res.json({ message: 'Joined successfully!', balance: user.wallet_balance, participantCount: updatedMatch.participants.length });

        } catch (innerError) {
            // Catch any database errors during match update and refund
            console.error("Match join error, refunding:", innerError);
            await User.findByIdAndUpdate(userId, {
                $inc: { wallet_balance: match.entry_fee },
                $pull: { matches_played: matchId }
            });
            res.status(500).json({ message: 'Error joining match, entry fee refunded.' });
        }
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

        let refundCount = 0;
        let refundedAmount = 0;

        // If match has participants who paid, refund them
        if (match.participants.length > 0 && match.entry_fee > 0 && match.status !== 'completed') {
            const userIds = match.participants.map(p => p.user);

            // Bulk update wallets
            await User.updateMany(
                { _id: { $in: userIds } },
                { $inc: { wallet_balance: match.entry_fee } }
            );

            // Create refund transactions
            const transactions = userIds.map(uid => ({
                user: uid,
                type: 'refund',
                amount: match.entry_fee,
                status: 'completed',
                match: match._id,
                description: `Refund: "${match.title}" was deleted by admin`
            }));

            if (transactions.length > 0) {
                await Transaction.insertMany(transactions);
            }

            refundCount = userIds.length;
            refundedAmount = refundCount * match.entry_fee;
        }

        await Match.findByIdAndDelete(req.params.id);

        // Also clean up related transactions
        await Transaction.updateMany(
            { match: req.params.id, type: 'entry_fee', status: 'completed' },
            { $set: { description: `Entry fee for "${match.title}" (match deleted, refunded)` } }
        );

        res.json({
            message: `Match deleted.${refundCount > 0 ? ` ₹${refundedAmount} refunded to ${refundCount} participant(s).` : ''}`,
            refundedCount: refundCount,
            refundedAmount: refundedAmount
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
        let refundMsg = '';

        // If cancelling, refund all participants
        if (status === 'cancelled' && oldStatus !== 'cancelled' && oldStatus !== 'completed') {
            if (match.participants.length > 0 && match.entry_fee > 0) {
                const userIds = match.participants.map(p => p.user);

                // Bulk refund
                await User.updateMany(
                    { _id: { $in: userIds } },
                    { $inc: { wallet_balance: match.entry_fee } }
                );

                const transactions = userIds.map(uid => ({
                    user: uid,
                    type: 'refund',
                    amount: match.entry_fee,
                    status: 'completed',
                    match: match._id,
                    description: `Refund: "${match.title}" was cancelled`
                }));

                if (transactions.length > 0) {
                    await Transaction.insertMany(transactions);
                }

                refundMsg = ` ₹${match.entry_fee} refunded to ${userIds.length} participant(s).`;
            }
        }

        match.status = status;
        await match.save();

        // Socket notification
        const socketHandler = req.app.get('socketHandler');
        if (socketHandler) {
            socketHandler.emitMatchUpdate(req.params.id, { status, title: match.title });
        }

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
