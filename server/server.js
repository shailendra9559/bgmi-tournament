require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const isProd = process.env.NODE_ENV === 'production';

// CORS
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            FRONTEND_URL,
            'http://localhost:3000',
            'http://localhost:3001',
            'https://bgmi-tournament-production.up.railway.app'
        ];

        // Allow the exact frontend URL, localhost ports, and specific production domain
        if (allowedOrigins.includes(origin) || (!isProd && /\.ngrok-free\.app$/.test(origin))) {
            return callback(null, true);
        }

        // Allow Vercel preview deployments if needed (optional, safer to be strict for now)
        // if (/\.vercel\.app$/.test(origin)) return callback(null, true);

        // In dev, allow all; in prod, strict check
        if (!isProd) return callback(null, true);

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};

const io = new Server(httpServer, { cors: corsOptions });

// Socket handler
const socketHandler = require('./socket/socketHandler')(io);
app.set('socketHandler', socketHandler);

// Security
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '50kb' }));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// MongoDB
mongoose.connect(process.env.MONGO_URI, {
    autoIndex: false,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000
})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Error:', err.message);
        if (isProd) process.exit(1);
    });

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/articles', require('./routes/articleRoutes'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', env: isProd ? 'production' : 'development', timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(500).json({ message: isProd ? 'Internal server error' : err.message });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} | ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`🌐 CORS: ${FRONTEND_URL}`);
});
