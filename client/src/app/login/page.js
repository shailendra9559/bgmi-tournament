'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { login, register } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(username, email, password);
            }
            router.push('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
        setSubmitting(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card max-w-md w-full">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-white">🎮 BGMI Tournament</h1>
                    <p className="text-gray-400 mt-2">{isLogin ? 'Login to continue' : 'Create your account'}</p>
                </div>

                <div className="flex mb-6 bg-gray-700/50 rounded-lg p-1">
                    <button onClick={() => { setIsLogin(true); setError(''); }}
                        className={`flex-1 py-2.5 rounded-md transition-all font-medium ${isLogin ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                            }`}>Login</button>
                    <button onClick={() => { setIsLogin(false); setError(''); }}
                        className={`flex-1 py-2.5 rounded-md transition-all font-medium ${!isLogin ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                            }`}>Register</button>
                </div>

                {error && (
                    <div className="bg-red-900/30 border border-red-600/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                            placeholder="Username" className="input" required minLength={3} />
                    )}
                    <input type="email" value={email} onChange={e => setEmail(e.target.value.trim())}
                        placeholder="Email" className="input" required />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="Password" className="input" required minLength={6} />
                    <button type="submit" disabled={submitting}
                        className={`w-full btn-primary ${submitting ? 'opacity-50 cursor-wait' : ''}`}>
                        {submitting ? '⏳ Please wait...' : (isLogin ? 'Login' : 'Register')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
}
