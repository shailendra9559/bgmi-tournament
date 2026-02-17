'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
    const { user, logout, loading } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, []);

    return (
        <>
            <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
                ? 'bg-gray-900/95 backdrop-blur-md shadow-lg shadow-black/20'
                : 'bg-gray-900/80 backdrop-blur-md'
                } border-b border-gray-700/50`}>
                <div className="container mx-auto px-4 py-3.5 flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="text-2xl font-heading font-bold text-white hover:opacity-90 transition-opacity flex items-center gap-1">
                        🎮 <span className="text-gradient">BGMI</span> Tournament
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-5">
                        <Link href="/#tournaments" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
                            Tournaments
                        </Link>
                        <Link href="/blog" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
                            Blog
                        </Link>
                        <Link href="/#how-it-works" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
                            How It Works
                        </Link>
                        {loading ? (
                            <div className="animate-pulse w-24 h-6 bg-gray-700 rounded"></div>
                        ) : user ? (
                            <>
                                <Link href="/wallet" className="text-green-400 font-bold hover:text-green-300 transition-colors">
                                    💰 ₹{user.wallet_balance || 0}
                                </Link>
                                <span className="text-gray-400 text-sm">{user.username}</span>
                                {user.role === 'admin' && (
                                    <Link href="/admin" className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors">
                                        ⚙️ Admin
                                    </Link>
                                )}
                                <button onClick={logout}
                                    className="text-gray-400 hover:text-red-400 text-sm transition-colors">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <Link href="/login" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-medium py-2 px-5 rounded-lg transition-all shadow-md shadow-blue-500/20">
                                Login / Register
                            </Link>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden text-white p-2 focus:outline-none"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </nav>

            {/* Mobile menu overlay */}
            {menuOpen && (
                <>
                    <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />
                    <div className="mobile-menu">
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-xl font-heading font-bold text-white">Menu</span>
                            <button onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Link href="/" onClick={() => setMenuOpen(false)}
                                className="text-gray-300 hover:text-white py-2 text-lg transition-colors">
                                🏠 Home
                            </Link>
                            <Link href="/#tournaments" onClick={() => setMenuOpen(false)}
                                className="text-gray-300 hover:text-white py-2 text-lg transition-colors">
                                🏆 Tournaments
                            </Link>
                            <Link href="/blog" onClick={() => setMenuOpen(false)}
                                className="text-gray-300 hover:text-white py-2 text-lg transition-colors">
                                📝 Blog
                            </Link>
                            <Link href="/#how-it-works" onClick={() => setMenuOpen(false)}
                                className="text-gray-300 hover:text-white py-2 text-lg transition-colors">
                                📋 How It Works
                            </Link>

                            <div className="border-t border-gray-700/50 pt-4 mt-2">
                                {user ? (
                                    <>
                                        <div className="text-gray-400 text-sm mb-3">
                                            Signed in as <span className="text-white font-medium">{user.username}</span>
                                        </div>
                                        <Link href="/wallet" onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-2 text-green-400 font-bold py-2 text-lg">
                                            💰 ₹{user.wallet_balance || 0}
                                        </Link>
                                        {user.role === 'admin' && (
                                            <Link href="/admin" onClick={() => setMenuOpen(false)}
                                                className="text-yellow-400 py-2 text-lg block">
                                                ⚙️ Admin Panel
                                            </Link>
                                        )}
                                        <button onClick={() => { logout(); setMenuOpen(false); }}
                                            className="text-red-400 hover:text-red-300 py-2 text-lg w-full text-left mt-2">
                                            🚪 Logout
                                        </button>
                                    </>
                                ) : (
                                    <Link href="/login" onClick={() => setMenuOpen(false)}
                                        className="btn-primary text-center block">
                                        Login / Register
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
