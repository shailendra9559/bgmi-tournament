'use client';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
    const { user, logout, loading } = useAuth();

    return (
        <nav className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3.5 flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold text-white hover:opacity-90 transition-opacity">
                    🎮 <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">BGMI</span> Tournament
                </Link>

                <div className="flex items-center gap-4">
                    {loading ? (
                        <div className="animate-pulse w-24 h-6 bg-gray-700 rounded"></div>
                    ) : user ? (
                        <>
                            <Link href="/wallet" className="text-green-400 font-bold hover:text-green-300 transition-colors">
                                💰 ₹{user.wallet_balance || 0}
                            </Link>
                            <span className="text-gray-400 text-sm hidden sm:inline">{user.username}</span>
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
                        <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
