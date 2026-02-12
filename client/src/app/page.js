'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const API_URL = '';

function MatchCard({ match, onJoin, isJoined, user }) {
    const timeDiff = new Date(match.match_time) - new Date();
    const minutesLeft = Math.floor(timeDiff / 1000 / 60);
    const hoursLeft = Math.floor(minutesLeft / 60);
    const isFull = match.participantCount >= (match.max_participants || 100);

    return (
        <div className="card hover:border-blue-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex justify-between items-center mb-3">
                <span className="bg-yellow-500/90 text-black px-3 py-1 text-xs font-bold rounded-full">
                    {match.map}
                </span>
                <span className="bg-blue-600/90 text-white px-3 py-1 text-xs font-bold rounded-full">
                    {match.type}
                </span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">{match.title}</h2>

            <div className="text-gray-400 text-sm mb-4">
                {hoursLeft > 0 ? `⏰ Starts in ${hoursLeft}h ${minutesLeft % 60}m` :
                    minutesLeft > 0 ? `⏰ Starts in ${minutesLeft}m` : '🔴 Starting soon!'}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-gray-700/50 rounded-lg p-2">
                    <div className="text-green-400 font-bold text-lg">₹{match.prize_pool}</div>
                    <div className="text-xs text-gray-500">Prize Pool</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-2">
                    <div className="text-yellow-400 font-bold text-lg">₹{match.entry_fee}</div>
                    <div className="text-xs text-gray-500">Entry Fee</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-2">
                    <div className="text-blue-400 font-bold text-lg">₹{match.per_kill}</div>
                    <div className="text-xs text-gray-500">Per Kill</div>
                </div>
            </div>

            {/* Progress bar for participants */}
            <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>👥 {match.participantCount || 0}/{match.max_participants || 100}</span>
                    <span>{new Date(match.match_time).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(((match.participantCount || 0) / (match.max_participants || 100)) * 100, 100)}%` }}></div>
                </div>
            </div>

            {match.room_id && match.room_id !== 'Hidden' && (
                <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-3 mb-4 text-center animate-pulse">
                    <div className="text-green-400 font-bold">🔑 Room ID: {match.room_id}</div>
                    <div className="text-green-400">🔒 Password: {match.room_password}</div>
                </div>
            )}

            {isJoined ? (
                <button disabled className="w-full bg-gray-600 text-gray-300 font-bold py-3 px-6 rounded-lg cursor-not-allowed">
                    ✅ Already Joined
                </button>
            ) : isFull ? (
                <button disabled className="w-full bg-red-900/50 text-red-400 font-bold py-3 px-6 rounded-lg cursor-not-allowed">
                    Match Full
                </button>
            ) : (
                <button onClick={() => onJoin(match._id, match.entry_fee)}
                    className="w-full btn-primary hover:scale-[1.02] active:scale-95 transition-transform">
                    Join Match — ₹{match.entry_fee}
                </button>
            )}
        </div>
    );
}

export default function Home() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, refreshUser } = useAuth();

    useEffect(() => {
        fetchMatches();
        const interval = setInterval(fetchMatches, 30000); // auto-refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchMatches = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/matches`);
            setMatches(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const joinMatch = async (matchId, fee) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login first!');
            return;
        }
        if (!user || user.wallet_balance < fee) {
            alert('Insufficient balance! Please add money to wallet.');
            return;
        }
        try {
            const res = await axios.post(`${API_URL}/api/matches/join`,
                { matchId, bgmi_name: user.bgmi_name || user.username },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(res.data.message);
            fetchMatches();
            refreshUser();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to join');
        }
    };

    const isJoinedMatch = (match) => {
        if (!user) return false;
        return match.participants?.some(p => p.user === user.id || p.user?._id === user.id);
    };

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Hero section */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">
                        🏆 Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Tournaments</span>
                    </h1>
                    <p className="text-gray-400 text-lg">Join BGMI matches, compete and win real money!</p>
                    {user && (
                        <div className="mt-4 inline-block bg-gray-800/60 border border-gray-700 rounded-full px-6 py-2 text-sm">
                            💰 Balance: <span className="text-green-400 font-bold">₹{user.wallet_balance || 0}</span>
                            <span className="mx-3 text-gray-600">|</span>
                            <Link href="/wallet" className="text-blue-400 hover:text-blue-300">Add Money →</Link>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center pt-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : matches.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🎮</div>
                        <p className="text-gray-400 text-xl">No matches available right now</p>
                        <p className="text-gray-500 mt-2">Check back soon — new tournaments are added daily!</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {matches.map(match => (
                            <MatchCard key={match._id} match={match} onJoin={joinMatch}
                                isJoined={isJoinedMatch(match)} user={user} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
