const jwt = require('jsonwebtoken');

module.exports = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication required'));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.userId}`);

        socket.on('join_match_room', (matchId) => {
            socket.join(`match_${matchId}`);
            console.log(`User ${socket.userId} joined match room: ${matchId}`);
        });

        socket.on('leave_match_room', (matchId) => {
            socket.leave(`match_${matchId}`);
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
        });
    });

    return {
        emitMatchUpdate: (matchId, data) => {
            io.to(`match_${matchId}`).emit('match_updated', data);
        },
        emitParticipantJoined: (matchId, participant) => {
            io.to(`match_${matchId}`).emit('participant_joined', participant);
        },
        emitRoomCredentials: (matchId, roomId, roomPassword) => {
            io.to(`match_${matchId}`).emit('room_revealed', { roomId, roomPassword });
        },
        emitResults: (matchId, results) => {
            io.to(`match_${matchId}`).emit('results_announced', results);
        },
        broadcast: (event, data) => {
            io.emit(event, data);
        }
    };
};
