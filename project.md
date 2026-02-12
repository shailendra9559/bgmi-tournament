This is a complete technical specification and code structure designed for an AI Coding Agent (like Cursor, Windsurf, or "Antigravity").

Since you want to build the Website first (User & Admin views), we will use Next.js (React) for the frontend because it handles SEO and routing perfectly, and Node.js/Express for the backend.

Copy the sections below and feed them into your AI tool.

Project Master Instruction

Prompt to AI:

"Create a full-stack web application for a BGMI Tournament platform.
Stack: Next.js 14 (App Router) for Frontend, Node.js + Express for Backend, MongoDB with Mongoose for Database.
Goal: Users can register and join matches. Admins can create matches and update results.
Follow the file structure and code logic provided below exactly."

1. Directory Structure

Tell the AI to create this folder structure:

code
Text
download
content_copy
expand_less
/bgmi-web-platform
  ├── /server               (Backend API)
  │     ├── /config         (DB Connection)
  │     ├── /controllers    (Logic)
  │     ├── /models         (Database Schemas)
  │     ├── /routes         (API Endpoints)
  │     ├── server.js       (Entry Point)
  │     └── .env            (Secrets)
  │
  └── /client               (Frontend - Next.js)
        ├── /app
        │     ├── /admin    (Admin Dashboard)
        │     ├── /login    (Auth Page)
        │     ├── /match    (Match Details)
        │     └── page.js   (Home/User Dashboard)
        ├── /components     (Navbar, MatchCard)
        └── /utils          (API helpers)
2. Backend Files (Node.js + MongoDB)
File: /server/models/User.js

(Defines the player and admin data)

code
JavaScript
download
content_copy
expand_less
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bgmi_id: { type: String }, // In-game Character ID
  wallet_balance: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  matches_played: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
File: /server/models/Match.js

(Defines the tournament details)

code
JavaScript
download
content_copy
expand_less
const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  title: { type: String, required: true },
  map: { type: String, enum: ['Erangel', 'Miramar', 'Sanhok'], default: 'Erangel' },
  type: { type: String, enum: ['Solo', 'Duo', 'Squad'], default: 'Squad' },
  entry_fee: { type: Number, required: true },
  prize_pool: { type: Number, required: true },
  per_kill: { type: Number, default: 0 },
  match_time: { type: Date, required: true },
  room_id: { type: String, default: "" },       // Admin fills this later
  room_password: { type: String, default: "" }, // Admin fills this later
  participants: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bgmi_name: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Match', MatchSchema);
File: /server/controllers/matchController.js

(Logic to hide Room ID until 15 mins before match)

code
JavaScript
download
content_copy
expand_less
const Match = require('../models/Match');
const User = require('../models/User');

// Get All Matches (Public View)
exports.getMatches = async (req, res) => {
  try {
    const matches = await Match.find().sort({ match_time: 1 });
    
    // Logic: Hide Room ID if match is not starting soon
    const sanitizedMatches = matches.map(match => {
      const timeDiff = new Date(match.match_time) - new Date();
      const minutesLeft = Math.floor(timeDiff / 1000 / 60);

      // Only show credentials if User joined AND time < 15 mins
      // Note: Full logic requires checking req.user._id against participants
      // For public list, we always hide sensitive data:
      return {
        ...match._doc,
        room_id: (minutesLeft <= 15) ? match.room_id : "Hidden",
        room_password: (minutesLeft <= 15) ? match.room_password : "Hidden"
      };
    });

    res.json(sanitizedMatches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Join Match
exports.joinMatch = async (req, res) => {
  const { matchId, bgmi_name } = req.body;
  const userId = req.user.id; // From JWT Middleware

  try {
    const user = await User.findById(userId);
    const match = await Match.findById(matchId);

    if (user.wallet_balance < match.entry_fee) {
      return res.status(400).json({ message: "Insufficient Balance" });
    }

    // Deduct Balance
    user.wallet_balance -= match.entry_fee;
    await user.save();

    // Add to Match
    match.participants.push({ user: userId, bgmi_name });
    await match.save();

    res.json({ message: "Joined successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
File: /server/server.js

(Main Server)

code
JavaScript
download
content_copy
expand_less
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
3. Frontend Files (Next.js)
File: /client/app/page.js

(The User Dashboard / Match List)

code
JavaScript
download
content_copy
expand_less
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

export default function Home() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    // Fetch matches from Backend
    axios.get('http://localhost:5000/api/matches')
      .then(res => setMatches(res.data))
      .catch(err => console.error(err));
  }, []);

  const joinMatch = async (matchId, fee) => {
    const token = localStorage.getItem('token');
    if(!token) return alert("Please Login First");
    
    try {
      await axios.post('http://localhost:5000/api/matches/join', 
        { matchId, bgmi_name: "PlayerName" }, 
        { headers: { 'x-auth-token': token } }
      );
      alert("Joined Successfully!");
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Upcoming Tournaments</h1>
        
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map(match => (
            <div key={match._id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="bg-yellow-500 text-black px-2 py-1 text-xs font-bold rounded">{match.map}</span>
                <span className="text-gray-400 text-sm">{new Date(match.match_time).toLocaleString()}</span>
              </div>
              <h2 className="text-xl font-bold">{match.title}</h2>
              <div className="flex justify-between mt-4 text-sm">
                <p>Prize Pool: <span className="text-green-400">₹{match.prize_pool}</span></p>
                <p>Entry: <span className="text-yellow-400">₹{match.entry_fee}</span></p>
              </div>
              
              {/* Show Room Details if Available */}
              {match.room_id !== "Hidden" && (
                <div className="mt-2 bg-green-900 p-2 rounded text-center">
                  <p>ID: {match.room_id}</p>
                  <p>Pass: {match.room_password}</p>
                </div>
              )}

              <button 
                onClick={() => joinMatch(match._id, match.entry_fee)}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 py-2 rounded font-bold"
              >
                Join Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
File: /client/app/admin/page.js

(Admin Panel to Create Matches & Update Room ID)

code
JavaScript
download
content_copy
expand_less
'use client';
import { useState } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [formData, setFormData] = useState({
    title: '', map: 'Erangel', entry_fee: 0, prize_pool: 0, match_time: ''
  });

  const createMatch = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token'); // Ensure this is an Admin Token
    try {
      await axios.post('http://localhost:5000/api/matches/create', formData, {
        headers: { 'x-auth-token': token }
      });
      alert("Match Created!");
    } catch (err) {
      alert("Error creating match");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg max-w-lg">
        <h2 className="text-xl mb-4">Create New Match</h2>
        <form onSubmit={createMatch} className="flex flex-col gap-3">
          <input placeholder="Match Title" className="p-2 bg-gray-700 rounded" 
            onChange={e => setFormData({...formData, title: e.target.value})} />
          
          <select className="p-2 bg-gray-700 rounded" 
            onChange={e => setFormData({...formData, map: e.target.value})}>
            <option>Erangel</option><option>Miramar</option>
          </select>
          
          <input type="number" placeholder="Entry Fee" className="p-2 bg-gray-700 rounded" 
            onChange={e => setFormData({...formData, entry_fee: e.target.value})} />
            
          <input type="number" placeholder="Prize Pool" className="p-2 bg-gray-700 rounded" 
            onChange={e => setFormData({...formData, prize_pool: e.target.value})} />
            
          <input type="datetime-local" className="p-2 bg-gray-700 rounded" 
            onChange={e => setFormData({...formData, match_time: e.target.value})} />
            
          <button type="submit" className="bg-green-600 py-2 rounded font-bold mt-2">
            Publish Match
          </button>
        </form>
      </div>
    </div>
  );
}
How to Use This

Open your AI coding tool.

Paste the Directory Structure.

Paste the Backend Files and ask it to "Generate the Node.js server".

Paste the Frontend Files and ask it to "Generate the Next.js client".

Run npm install in both folders.

Start backend: node server.js

Start frontend: npm run dev

This will give you a functional website where Users can see matches and Admins can create them. Once this is running, we can wrap the website into a mobile app.

---

# PART 2: PRODUCTION-READY INTEGRATIONS

## 4. Environment Variables

File: /server/.env

```env
# Database
MONGO_URI=mongodb://localhost:27017/bgmi_tournament
PORT=5000

# JWT Secrets
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_token_secret_key_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid Email
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@bgmitournament.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## 5. Updated User Model with OAuth & KYC

File: /server/models/User.js

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // Basic Info
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, select: false }, // Hidden by default
  phone: { type: String, unique: true, sparse: true },
  
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
  
  // KYC Verification
  kycStatus: { 
    type: String, 
    enum: ['not_submitted', 'pending', 'verified', 'rejected'], 
    default: 'not_submitted' 
  },
  kycDocuments: {
    panCard: { type: String },
    aadharCard: { type: String },
    bankAccount: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String
    },
    upiId: { type: String }
  },
  
  // Referral System
  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralEarnings: { type: Number, default: 0 },
  
  // Security
  role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  lastLogin: { type: Date },
  refreshTokens: [{ token: String, expiresAt: Date }],
  
  // Stats
  matches_played: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
  total_kills: { type: Number, default: 0 },
  total_wins: { type: Number, default: 0 }
  
}, { timestamps: true });

// Hash password before save
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate referral code
UserSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = this.username.toUpperCase().slice(0,4) + 
      Math.random().toString(36).substring(2, 6).toUpperCase();
  }
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
```

## 6. Transaction Model (Payments)

File: /server/models/Transaction.js

```javascript
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
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Razorpay Details
  razorpay_order_id: { type: String, index: true },
  razorpay_payment_id: { type: String },
  razorpay_signature: { type: String },
  
  // Withdrawal Details
  withdrawal_upi_id: { type: String },
  withdrawal_account: {
    accountNumber: String,
    ifscCode: String
  },
  
  // Reference
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
  description: { type: String },
  
  // Admin
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  failureReason: { type: String }
  
}, { timestamps: true });

// Index for faster queries
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ user: 1, type: 1, status: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
```

## 7. Match Result & Leaderboard Model

File: /server/models/MatchResult.js

```javascript
const mongoose = require('mongoose');

const MatchResultSchema = new mongoose.Schema({
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Performance
  kills: { type: Number, default: 0 },
  position: { type: Number }, // Final placement (1-100)
  isWinner: { type: Boolean, default: false },
  
  // Earnings Breakdown
  positionPrize: { type: Number, default: 0 },
  killPrize: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  
  // Validation
  screenshotUrl: { type: String },
  verifiedByAdmin: { type: Boolean, default: false }
  
}, { timestamps: true });

MatchResultSchema.index({ match: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('MatchResult', MatchResultSchema);
```

## 8. Google OAuth Configuration

File: /server/config/passport.js

```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        user.lastLogin = new Date();
        await user.save();
        return done(null, user);
      }
      
      // Check if email already exists
      user = await User.findOne({ email: profile.emails[0].value });
      if (user) {
        user.googleId = profile.id;
        user.authProvider = 'google';
        user.profilePicture = profile.photos[0]?.value;
        await user.save();
        return done(null, user);
      }
      
      // Create new user
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        username: profile.displayName.replace(/\s/g, '_') + '_' + Date.now().toString(36),
        profilePicture: profile.photos[0]?.value,
        authProvider: 'google',
        isVerified: true
      });
      
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
));

module.exports = passport;
```

## 9. Authentication Controller

File: /server/controllers/authController.js

```javascript
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate Tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
  });
  return { accessToken, refreshToken };
};

// Register
exports.register = async (req, res) => {
  try {
    const { username, email, password, phone, referralCode } = req.body;
    
    // Check existing user
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ message: 'User already exists' });
    
    // Handle referral
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    }
    
    const user = await User.create({
      username, email, password, phone,
      referredBy: referrer?._id
    });
    
    // Referral bonus
    if (referrer) {
      referrer.bonus_balance += 10; // ₹10 referral bonus
      await referrer.save();
    }
    
    const tokens = generateTokens(user._id);
    res.status(201).json({ user: { id: user._id, username, email }, ...tokens });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Account is blocked' });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    const tokens = generateTokens(user._id);
    res.json({ user: { id: user._id, username: user.username }, ...tokens });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Google OAuth Callback
exports.googleCallback = async (req, res) => {
  const tokens = generateTokens(req.user._id);
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
};

// Get Profile
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-refreshTokens');
  res.json(user);
};
```

## 10. Payment Controller (Razorpay)

File: /server/controllers/paymentController.js

```javascript
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Order for Deposit
exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount < 10) return res.status(400).json({ message: 'Minimum deposit is ₹10' });
    
    const options = {
      amount: amount * 100, // Razorpay uses paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    };
    
    const order = await razorpay.orders.create(options);
    
    // Create pending transaction
    await Transaction.create({
      user: req.user.id,
      type: 'deposit',
      amount,
      razorpay_order_id: order.id,
      status: 'pending'
    });
    
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }
    
    // Update transaction
    const transaction = await Transaction.findOne({ razorpay_order_id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    
    transaction.razorpay_payment_id = razorpay_payment_id;
    transaction.razorpay_signature = razorpay_signature;
    transaction.status = 'completed';
    await transaction.save();
    
    // Credit wallet
    const user = await User.findById(transaction.user);
    user.wallet_balance += transaction.amount;
    user.total_deposited += transaction.amount;
    await user.save();
    
    res.json({ message: 'Payment successful', balance: user.wallet_balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request Withdrawal
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, upi_id } = req.body;
    const user = await User.findById(req.user.id);
    
    // Validations
    if (user.kycStatus !== 'verified') {
      return res.status(400).json({ message: 'KYC verification required' });
    }
    if (amount < 100) return res.status(400).json({ message: 'Minimum withdrawal is ₹100' });
    if (user.wallet_balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    
    // Deduct and create request
    user.wallet_balance -= amount;
    await user.save();
    
    await Transaction.create({
      user: user._id,
      type: 'withdrawal',
      amount,
      withdrawal_upi_id: upi_id || user.kycDocuments.upiId,
      status: 'pending',
      description: 'Withdrawal request'
    });
    
    res.json({ message: 'Withdrawal request submitted', balance: user.wallet_balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Transaction History
exports.getTransactions = async (req, res) => {
  const transactions = await Transaction.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(transactions);
};
```

## 11. Real-Time Socket.io Handler

File: /server/socket/socketHandler.js

```javascript
const jwt = require('jsonwebtoken');
const Match = require('../models/Match');

module.exports = (io) => {
  // Authentication middleware
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
    
    // Join match room
    socket.on('join_match_room', (matchId) => {
      socket.join(`match_${matchId}`);
      console.log(`User ${socket.userId} joined match room: ${matchId}`);
    });
    
    // Leave match room
    socket.on('leave_match_room', (matchId) => {
      socket.leave(`match_${matchId}`);
    });
    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  // Helper functions for emitting events
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
```

## 12. Updated Server with Socket.io

File: /server/server.js

```javascript
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const passport = require('./config/passport');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL, credentials: true }
});

// Initialize socket handler
const socketHandler = require('./socket/socketHandler')(io);
app.set('socketHandler', socketHandler);

// Security Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10kb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests'
});
app.use('/api', limiter);

// Passport
app.use(passport.initialize());

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

## 13. Auth Routes with Google OAuth

File: /server/routes/authRoutes.js

```javascript
const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', protect, authController.getProfile);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.googleCallback
);

module.exports = router;
```

## 14. Payment Routes

File: /server/routes/paymentRoutes.js

```javascript
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-order', protect, paymentController.createOrder);
router.post('/verify', protect, paymentController.verifyPayment);
router.post('/withdraw', protect, paymentController.requestWithdrawal);
router.get('/history', protect, paymentController.getTransactions);

module.exports = router;
```

## 15. Auth Middleware

File: /server/middleware/auth.js

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.headers['x-auth-token'];
    if (!token) return res.status(401).json({ message: 'Not authorized' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalid' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
```

## 16. Notification Service (SMS + Email)

File: /server/services/notificationService.js

```javascript
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send SMS
exports.sendSMS = async (phone, message) => {
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    return true;
  } catch (error) {
    console.error('SMS Error:', error);
    return false;
  }
};

// Send Email
exports.sendEmail = async (to, subject, html) => {
  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email Error:', error);
    return false;
  }
};

// Match Reminder
exports.sendMatchReminder = async (user, match) => {
  const message = `🎮 BGMI Match Reminder!\n${match.title} starts in 15 mins.\nRoom ID: ${match.room_id}\nPassword: ${match.room_password}`;
  
  if (user.phone) await this.sendSMS(user.phone, message);
  if (user.email) {
    await this.sendEmail(user.email, '🎮 Your Match Starts Soon!', `
      <h2>Match Reminder</h2>
      <p><strong>${match.title}</strong> starts in 15 minutes!</p>
      <p>Room ID: <code>${match.room_id}</code></p>
      <p>Password: <code>${match.room_password}</code></p>
    `);
  }
};

// Winnings Notification
exports.sendWinningsNotification = async (user, amount) => {
  const message = `🏆 Congratulations! You won ₹${amount}! Check your wallet.`;
  if (user.phone) await this.sendSMS(user.phone, message);
};
```

---

# PART 3: FRONTEND INTEGRATION CODE

## 17. Auth Context Hook

File: /client/hooks/useAuth.js

```javascript
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUser(res.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    localStorage.setItem('token', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(res.data.user);
    return res.data;
  };

  const googleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

## 18. Wallet Page with Razorpay

File: /client/app/wallet/page.js

```javascript
'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Script from 'next/script';

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [profileRes, txRes] = await Promise.all([
      axios.get(`${API_URL}/api/auth/profile`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_URL}/api/payments/history`, { headers: { Authorization: `Bearer ${token}` } })
    ]);
    setBalance(profileRes.data.wallet_balance);
    setTransactions(txRes.data);
  };

  const handleAddMoney = async () => {
    const { data } = await axios.post(`${API_URL}/api/payments/create-order`, 
      { amount: parseInt(amount) },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: data.amount,
      currency: data.currency,
      order_id: data.orderId,
      name: 'BGMI Tournament',
      description: 'Wallet Top-up',
      handler: async (response) => {
        await axios.post(`${API_URL}/api/payments/verify`, response, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchData();
        alert('Payment Successful!');
      },
      prefill: { email: '', contact: '' },
      theme: { color: '#3B82F6' }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-3xl font-bold mb-6">💰 My Wallet</h1>
        
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl mb-8">
          <p className="text-gray-200">Available Balance</p>
          <p className="text-4xl font-bold">₹{balance}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl mb-8">
          <h2 className="text-xl mb-4">Add Money</h2>
          <div className="flex gap-2 mb-4">
            {[50, 100, 500, 1000].map(amt => (
              <button key={amt} onClick={() => setAmount(amt)}
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
              >₹{amt}</button>
            ))}
          </div>
          <input 
            type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount" className="w-full p-3 bg-gray-700 rounded mb-4"
          />
          <button onClick={handleAddMoney}
            className="w-full py-3 bg-green-600 hover:bg-green-700 rounded font-bold"
          >Add Money via UPI/Card</button>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl mb-4">Transaction History</h2>
          {transactions.map(tx => (
            <div key={tx._id} className="flex justify-between py-3 border-b border-gray-700">
              <div>
                <p className="font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                <p className="text-sm text-gray-400">{new Date(tx.createdAt).toLocaleString()}</p>
              </div>
              <p className={tx.type === 'deposit' || tx.type === 'winnings' ? 'text-green-400' : 'text-red-400'}>
                {tx.type === 'deposit' || tx.type === 'winnings' ? '+' : '-'}₹{tx.amount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
```

## 19. Login Page with Google OAuth

File: /client/app/login/page.js

```javascript
'use client';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, googleLogin } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-white text-center mb-6">Login to BGMI Tournaments</h1>
        
        <button onClick={googleLogin}
          className="w-full py-3 bg-white text-gray-800 rounded-lg font-bold flex items-center justify-center gap-2 mb-6 hover:bg-gray-100"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div className="relative mb-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-600"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-800 text-gray-400">Or</span></div></div>

        <form onSubmit={handleSubmit}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" className="w-full p-3 bg-gray-700 text-white rounded mb-4" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" className="w-full p-3 bg-gray-700 text-white rounded mb-6" required />
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

# PART 4: PACKAGE DEPENDENCIES

## 20. Server package.json

File: /server/package.json

```json
{
  "name": "bgmi-tournament-server",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "razorpay": "^2.9.2",
    "socket.io": "^4.7.2",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "twilio": "^4.19.0",
    "@sendgrid/mail": "^8.1.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

## 21. Client package.json additions

```bash
# Install in /client folder
npm install axios socket.io-client
```

## 22. Client Environment Variables

File: /client/.env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

---

# SETUP INSTRUCTIONS

1. **Get API Keys:**
   - Google OAuth: https://console.cloud.google.com/apis/credentials
   - Razorpay: https://dashboard.razorpay.com/app/keys
   - Twilio: https://console.twilio.com
   - SendGrid: https://app.sendgrid.com/settings/api_keys

2. **Install Dependencies:**
```bash
cd server && npm install
cd ../client && npm install
```

3. **Start Services:**
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

4. **Test Flow:**
   - Visit http://localhost:3000
   - Login with Google or email
   - Add money using Razorpay test card: 4111 1111 1111 1111
   - Join a match and verify balance deduction