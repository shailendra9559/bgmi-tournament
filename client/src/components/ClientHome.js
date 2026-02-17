'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import MatchCard from './MatchCard';
import AnimatedCounter from './AnimatedCounter';
import { useReveal } from '../hooks/useReveal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://bgmi-tournament-production.up.railway.app');

export default function ClientHome() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, refreshUser } = useAuth();

    const revealTournaments = useReveal();
    const revealHowItWorks = useReveal();
    const revealFeatures = useReveal();
    const revealStats = useReveal();

    useEffect(() => {
        fetchMatches();
        const interval = setInterval(fetchMatches, 30000);
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
        if (!token) { alert('Please login first!'); return; }
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
            {/* ═══════════ LIVE TOURNAMENTS ═══════════ */}
            <section id="tournaments" className="py-16 md:py-20" ref={revealTournaments}>
                <div className="container mx-auto px-4 reveal">
                    <h2 className="section-title font-heading">
                        🏆 Live <span className="text-gradient">Tournaments</span>
                    </h2>
                    <p className="section-subtitle">
                        Join now and compete with players across India
                    </p>

                    {user && (
                        <div className="text-center mb-8">
                            <div className="inline-block glass px-6 py-2.5 text-sm">
                                💰 Your Balance: <span className="text-green-400 font-bold">₹{user.wallet_balance || 0}</span>
                                <span className="mx-3 text-gray-600">|</span>
                                <Link href="/wallet" className="text-blue-400 hover:text-blue-300 transition-colors">Add Money →</Link>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center min-h-[300px] pt-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="text-center py-16 flex flex-col items-center justify-center min-h-[300px]">
                            <div className="text-7xl mb-4 animate-float">🎮</div>
                            <p className="text-gray-400 text-xl font-heading">No matches available right now</p>
                            <p className="text-gray-500 mt-2">Check back soon — new tournaments are added daily!</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {matches.map((match, index) => (
                                <div key={match._id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                                    <MatchCard match={match} onJoin={joinMatch}
                                        isJoined={isJoinedMatch(match)} user={user} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ═══════════ HOW IT WORKS ═══════════ */}
            <section id="how-it-works" className="py-16 md:py-20 bg-gray-900/30" ref={revealHowItWorks}>
                <div className="container mx-auto px-4 reveal">
                    <h2 className="section-title font-heading">
                        📋 How It <span className="text-gradient-blue">Works</span>
                    </h2>
                    <p className="section-subtitle">Get started in 3 simple steps</p>

                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {[
                            {
                                step: '1',
                                icon: '📝',
                                title: 'Register Free',
                                desc: 'Create your account in seconds. No hidden charges, completely free to join.'
                            },
                            {
                                step: '2',
                                icon: '🎮',
                                title: 'Join a Match',
                                desc: 'Browse live tournaments, pick your match and pay the entry fee from your wallet.'
                            },
                            {
                                step: '3',
                                icon: '🏆',
                                title: 'Win & Withdraw',
                                desc: 'Play the match, score kills and rank high. Winnings are credited instantly!'
                            }
                        ].map((item, i) => (
                            <div key={i} className="text-center animate-slide-up" style={{ animationDelay: `${i * 150}ms` }}>
                                <div className="step-circle">{item.step}</div>
                                <div className="text-3xl mb-3">{item.icon}</div>
                                <h3 className="text-xl font-heading font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ FEATURES ═══════════ */}
            <section className="py-16 md:py-20" ref={revealFeatures}>
                <div className="container mx-auto px-4 reveal">
                    <h2 className="section-title font-heading">
                        ⚡ Why Choose <span className="text-gradient">Us</span>
                    </h2>
                    <p className="section-subtitle">Built for serious BGMI players who want to compete and earn</p>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                        {[
                            {
                                icon: '💸',
                                title: 'Instant Payouts',
                                desc: 'Win and withdraw your earnings instantly to your bank or UPI.',
                                color: 'from-green-500/20 to-emerald-500/20',
                                border: 'border-green-500/30'
                            },
                            {
                                icon: '🛡️',
                                title: 'Fair Play Guarantee',
                                desc: 'Anti-cheat monitoring and manual verification for every match.',
                                color: 'from-blue-500/20 to-cyan-500/20',
                                border: 'border-blue-500/30'
                            },
                            {
                                icon: '📱',
                                title: '24/7 Support',
                                desc: 'Round-the-clock WhatsApp and in-app support for any issues.',
                                color: 'from-purple-500/20 to-pink-500/20',
                                border: 'border-purple-500/30'
                            },
                            {
                                icon: '📊',
                                title: 'Leaderboards',
                                desc: 'Track your stats, climb the rankings and become the top player.',
                                color: 'from-yellow-500/20 to-orange-500/20',
                                border: 'border-yellow-500/30'
                            }
                        ].map((feature, i) => (
                            <div key={i}
                                className={`glass p-6 rounded-xl border ${feature.border} hover:-translate-y-1 transition-all duration-300 animate-slide-up`}
                                style={{ animationDelay: `${i * 100}ms` }}>
                                <div className={`feature-icon bg-gradient-to-br ${feature.color}`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-heading font-bold text-white mb-2">{feature.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ STATS SECTION ═══════════ */}
            <section className="py-16 md:py-20 bg-gray-900/30" ref={revealStats}>
                <div className="container mx-auto px-4 reveal">
                    <div className="glass p-8 md:p-12 rounded-2xl max-w-4xl mx-auto text-center">
                        <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-8">
                            Trusted by Players Across India 🇮🇳
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div>
                                <AnimatedCounter end={500} suffix="+" />
                                <div className="text-gray-400 text-sm mt-1">Active Players</div>
                            </div>
                            <div>
                                <AnimatedCounter end={50} prefix="₹" suffix="K+" />
                                <div className="text-gray-400 text-sm mt-1">Prize Distributed</div>
                            </div>
                            <div>
                                <AnimatedCounter end={100} suffix="+" />
                                <div className="text-gray-400 text-sm mt-1">Matches Played</div>
                            </div>
                            <div>
                                <AnimatedCounter end={99} suffix="%" />
                                <div className="text-gray-400 text-sm mt-1">Payout Rate</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════ CTA SECTION ═══════════ */}
            <section className="py-16 md:py-20">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
                        Ready to <span className="text-gradient">Compete</span>?
                    </h2>
                    <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                        Join thousands of BGMI players who are already earning real money. Your next match is just a click away.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/#tournaments" className="btn-primary text-lg px-8 py-4 rounded-xl">
                            🏆 Browse Tournaments
                        </Link>
                        {!user && (
                            <Link href="/login" className="btn-outline text-lg px-8 py-4 rounded-xl">
                                Create Free Account →
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
