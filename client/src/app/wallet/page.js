'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';

const API_URL = '';

export default function WalletPage() {
    const { user, refreshUser } = useAuth();
    const [amount, setAmount] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [upiSettings, setUpiSettings] = useState({ upi_id: '', qr_code: '', min_deposit: 10 });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const [txRes, settingsRes] = await Promise.all([
                token ? axios.get(`${API_URL}/api/payments/history`, { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve({ data: [] }),
                axios.get(`${API_URL}/api/admin/settings`)
            ]);
            setTransactions(txRes.data);
            setUpiSettings(settingsRes.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const submitDeposit = async () => {
        const token = localStorage.getItem('token');
        if (!amount || amount < (upiSettings.min_deposit || 10)) {
            alert(`Minimum deposit is ₹${upiSettings.min_deposit || 10}`);
            return;
        }
        if (!transactionId || transactionId.trim().length < 5) {
            alert('Please enter a valid UPI Transaction ID');
            return;
        }
        setSubmitting(true);
        try {
            const res = await axios.post(`${API_URL}/api/admin/deposits/submit`,
                { amount: parseInt(amount), transaction_id: transactionId.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(res.data.message);
            setAmount('');
            setTransactionId('');
            fetchData();
            refreshUser();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit');
        }
        setSubmitting(false);
    };

    const statusColors = {
        completed: 'text-green-400', pending: 'text-yellow-400',
        rejected: 'text-red-400', failed: 'text-red-400', cancelled: 'text-gray-400'
    };
    const statusIcons = {
        completed: '✅', pending: '⏳', rejected: '❌', failed: '💔', cancelled: '🚫'
    };

    if (!user) {
        return (
            <>
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <p className="text-gray-400 text-xl mb-4">Please login to view your wallet</p>
                    <Link href="/login" className="btn-primary inline-block">Login</Link>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <h1 className="text-3xl font-bold text-white mb-6">💰 My Wallet</h1>

                {/* Balance Card */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-8 shadow-lg shadow-blue-500/20">
                    <p className="text-blue-100 text-sm">Available Balance</p>
                    <p className="text-5xl font-extrabold text-white mt-1">₹{user.wallet_balance || 0}</p>
                    {user.total_winnings > 0 && (
                        <p className="text-blue-200 text-sm mt-2">🏆 Total Winnings: ₹{user.total_winnings}</p>
                    )}
                </div>

                {/* UPI Payment Section */}
                <div className="card mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">💳 Add Money via UPI</h2>

                    {upiSettings.upi_id ? (
                        <>
                            <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-5 mb-4 text-center">
                                <p className="text-gray-400 text-sm mb-2">Pay to this UPI ID:</p>
                                <p className="text-2xl font-bold text-green-400 select-all tracking-wider">{upiSettings.upi_id}</p>
                                {upiSettings.qr_code && (
                                    <div className="mt-4">
                                        <img src={upiSettings.qr_code} alt="UPI QR Code" className="w-48 h-48 mx-auto bg-white p-2 rounded-lg" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-gray-400 text-sm block mb-2">Amount (Min ₹{upiSettings.min_deposit || 10})</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {[50, 100, 200, 500, 1000].map(amt => (
                                            <button key={amt} onClick={() => setAmount(amt.toString())}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${amount == amt ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                    }`}>₹{amt}</button>
                                        ))}
                                    </div>
                                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                                        placeholder="Or enter custom amount" className="input" min={upiSettings.min_deposit || 10} />
                                </div>

                                <div>
                                    <label className="text-gray-400 text-sm block mb-2">UPI Transaction ID (UTR)</label>
                                    <input type="text" value={transactionId} onChange={e => setTransactionId(e.target.value)}
                                        placeholder="Enter your UPI transaction ID" className="input" />
                                    <p className="text-gray-500 text-xs mt-1">📱 Find this in your payment app after successful payment</p>
                                </div>

                                <button onClick={submitDeposit} disabled={submitting}
                                    className={`w-full btn-success ${submitting ? 'opacity-50 cursor-wait' : ''}`}>
                                    {submitting ? '⏳ Submitting...' : '✅ Submit for Verification'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-400 text-center py-4">
                            Payment not available — admin has not set up UPI details yet.
                        </p>
                    )}
                </div>

                {/* Transaction History */}
                <div className="card">
                    <h2 className="text-xl font-bold text-white mb-4">📋 Transaction History</h2>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No transactions yet</p>
                    ) : (
                        <div className="space-y-1">
                            {transactions.map(tx => (
                                <div key={tx._id} className="flex justify-between items-center py-3 px-2 border-b border-gray-700/50 hover:bg-gray-700/20 rounded transition-colors">
                                    <div>
                                        <p className="text-white font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                                        <p className="text-gray-500 text-xs">{new Date(tx.createdAt).toLocaleString()}</p>
                                        <span className={`text-xs ${statusColors[tx.status] || 'text-gray-400'}`}>
                                            {statusIcons[tx.status] || ''} {tx.status}
                                        </span>
                                    </div>
                                    <p className={`font-bold text-lg ${tx.status === 'rejected' ? 'text-gray-500 line-through' :
                                        ['deposit', 'winnings', 'refund', 'bonus'].includes(tx.type) ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {['deposit', 'winnings', 'refund', 'bonus'].includes(tx.type) ? '+' : '-'}₹{tx.amount}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
