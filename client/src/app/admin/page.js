'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';

const API_URL = '';

export default function AdminPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('matches');
    const [matches, setMatches] = useState([]);
    const [pendingDeposits, setPendingDeposits] = useState([]);
    const [upiSettings, setUpiSettings] = useState({ upi_id: '', qr_code: '', min_deposit: 10 });
    const [allUsers, setAllUsers] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user', wallet_balance: 0 });
    const [walletEdit, setWalletEdit] = useState({});
    const [expandedMatch, setExpandedMatch] = useState(null);
    const [editingMatch, setEditingMatch] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [formData, setFormData] = useState({
        title: '', map: 'Erangel', type: 'Squad',
        entry_fee: 10, prize_pool: 100, per_kill: 5,
        max_participants: 100, match_time: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role === 'admin') fetchData();
    }, [user]);

    const getToken = () => localStorage.getItem('token');
    const headers = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

    const fetchData = async () => {
        try {
            const [matchRes, depositRes, settingsRes, usersRes] = await Promise.all([
                axios.get(`${API_URL}/api/matches/admin/all`, headers()),
                axios.get(`${API_URL}/api/admin/deposits/pending`, headers()),
                axios.get(`${API_URL}/api/admin/settings`),
                axios.get(`${API_URL}/api/admin/users`, headers())
            ]);
            setMatches(matchRes.data);
            setPendingDeposits(depositRes.data);
            setUpiSettings(settingsRes.data);
            setAllUsers(usersRes.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    // ─── Match Actions ───
    const createMatch = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/matches/create`, formData, headers());
            alert('✅ Match created!');
            setFormData({ ...formData, title: '', match_time: '' });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const deleteMatch = async (matchId, title) => {
        if (!confirm(`🗑️ Delete "${title}"?\n\nAll participants will be automatically refunded.`)) return;
        try {
            const res = await axios.delete(`${API_URL}/api/matches/${matchId}`, headers());
            alert(res.data.message);
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
    };

    const changeStatus = async (matchId, status) => {
        const confirmMsg = status === 'cancelled'
            ? 'Cancel this match? All participants will be refunded.'
            : `Change status to "${status}"?`;
        if (!confirm(confirmMsg)) return;
        try {
            const res = await axios.put(`${API_URL}/api/matches/${matchId}/status`, { status }, headers());
            alert(res.data.message);
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const updateMatch = async (matchId, data) => {
        try {
            await axios.put(`${API_URL}/api/matches/${matchId}`, data, headers());
            alert('✅ Updated!');
            setEditingMatch(null);
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const removeParticipant = async (matchId, userId, name) => {
        if (!confirm(`Remove ${name}? Entry fee will be refunded.`)) return;
        try {
            const res = await axios.delete(`${API_URL}/api/matches/${matchId}/participant/${userId}`, headers());
            alert(res.data.message);
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    // ─── Deposit Actions ───
    const verifyDeposit = async (transactionId, action) => {
        const notes = action === 'reject' ? prompt('Rejection reason (optional):') : '';
        try {
            const res = await axios.post(`${API_URL}/api/admin/deposits/verify`, { transactionId, action, notes }, headers());
            alert(res.data.message);
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    // ─── User Actions ───
    const createUser = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/api/admin/users/create`, newUser, headers());
            alert(res.data.message);
            setNewUser({ username: '', email: '', password: '', role: 'user', wallet_balance: 0 });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const deleteUser = async (userId, username) => {
        if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
        try {
            const res = await axios.delete(`${API_URL}/api/admin/users/${userId}`, headers());
            alert(res.data.message);
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const updateWallet = async (userId) => {
        const amt = walletEdit[userId];
        if (!amt && amt !== 0) return;
        try {
            const res = await axios.put(`${API_URL}/api/admin/users/${userId}/wallet`, { amount: Number(amt), action: 'add' }, headers());
            alert(res.data.message);
            setWalletEdit({ ...walletEdit, [userId]: '' });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const saveUpiSettings = async () => {
        try {
            await axios.put(`${API_URL}/api/admin/settings`, upiSettings, headers());
            alert('✅ UPI settings saved!');
        } catch (err) { alert('Failed to save'); }
    };

    // ─── Auth Gate ───
    if (!user || user.role !== 'admin') {
        return (
            <>
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <p className="text-red-400 text-xl mb-4">Admin access required</p>
                    <Link href="/" className="text-blue-400 hover:text-blue-300">← Back to Home</Link>
                </div>
            </>
        );
    }

    // ─── Helpers ───
    const statusColors = {
        upcoming: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
        live: 'bg-green-600/20 text-green-400 border-green-500/30',
        completed: 'bg-gray-600/20 text-gray-400 border-gray-500/30',
        cancelled: 'bg-red-600/20 text-red-400 border-red-500/30'
    };
    const filteredMatches = statusFilter === 'all' ? matches : matches.filter(m => m.status === statusFilter);

    const tabs = [
        { id: 'matches', label: '🎮 Matches', count: matches.length },
        { id: 'deposits', label: '💰 Deposits', count: pendingDeposits.length, highlight: pendingDeposits.length > 0 },
        { id: 'users', label: '👥 Users', count: allUsers.length },
        { id: 'settings', label: '⚙️ Settings' }
    ];

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-white">🔧 Admin Panel</h1>
                    <div className="text-gray-400 text-sm">
                        👥 {allUsers.length} users • 🎮 {matches.length} matches • 💰 {pendingDeposits.length} pending
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 flex-wrap bg-gray-800/50 p-1.5 rounded-xl w-fit">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                }`}>
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab.highlight ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-600 text-gray-300'
                                    }`}>{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ═══════ MATCHES TAB ═══════ */}
                {activeTab === 'matches' && (
                    <div className="space-y-8">
                        {/* Create Match Form */}
                        <div className="card">
                            <h2 className="text-xl font-bold text-white mb-4">➕ Create New Match</h2>
                            <form onSubmit={createMatch} className="space-y-4">
                                <input placeholder="Match Title (e.g. Friday Night Classic)" className="input" required
                                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Map</label>
                                        <select className="input" value={formData.map}
                                            onChange={e => setFormData({ ...formData, map: e.target.value })}>
                                            <option>Erangel</option><option>Miramar</option><option>Sanhok</option><option>Livik</option><option>Vikendi</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Type</label>
                                        <select className="input" value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                            <option>Solo</option><option>Duo</option><option>Squad</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Entry Fee (₹)</label>
                                        <input type="number" className="input" min={0}
                                            value={formData.entry_fee} onChange={e => setFormData({ ...formData, entry_fee: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Prize Pool (₹)</label>
                                        <input type="number" className="input" min={0}
                                            value={formData.prize_pool} onChange={e => setFormData({ ...formData, prize_pool: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Per Kill (₹)</label>
                                        <input type="number" className="input" min={0}
                                            value={formData.per_kill} onChange={e => setFormData({ ...formData, per_kill: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Max Players</label>
                                        <input type="number" className="input" min={1} max={100}
                                            value={formData.max_participants} onChange={e => setFormData({ ...formData, max_participants: Number(e.target.value) })} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-gray-500 block mb-1">Match Time</label>
                                        <input type="datetime-local" className="input" required
                                            value={formData.match_time} onChange={e => setFormData({ ...formData, match_time: e.target.value })} />
                                    </div>
                                </div>
                                <button type="submit" className="btn-success w-full sm:w-auto">🎮 Create Match</button>
                            </form>
                        </div>

                        {/* Match Filter */}
                        <div className="flex gap-2 flex-wrap items-center">
                            <span className="text-gray-400 text-sm">Filter:</span>
                            {['all', 'upcoming', 'live', 'completed', 'cancelled'].map(s => (
                                <button key={s} onClick={() => setStatusFilter(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-700/50 text-gray-400 hover:text-white'
                                        }`}>{s} {s !== 'all' && `(${matches.filter(m => m.status === s).length})`}</button>
                            ))}
                        </div>

                        {/* Match List */}
                        <div className="space-y-4">
                            {filteredMatches.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">No matches found</div>
                            ) : filteredMatches.map(match => (
                                <div key={match._id} className="card !p-0 overflow-hidden">
                                    {/* Match Header */}
                                    <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h3 className="font-bold text-white text-lg">{match.title}</h3>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${statusColors[match.status]}`}>
                                                    {match.status}
                                                </span>
                                            </div>
                                            <div className="text-gray-400 text-sm flex flex-wrap gap-3">
                                                <span>🗺️ {match.map}</span>
                                                <span>👥 {match.type}</span>
                                                <span>💰 ₹{match.entry_fee} entry</span>
                                                <span>🏆 ₹{match.prize_pool} prize</span>
                                                <span>🔫 ₹{match.per_kill}/kill</span>
                                                <span>👤 {match.participantCount}/{match.max_participants}</span>
                                            </div>
                                            <div className="text-gray-500 text-xs mt-1">
                                                📅 {new Date(match.match_time).toLocaleString()}
                                                {match.room_id && <span className="ml-3 text-green-400">🔑 Room: {match.room_id}</span>}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 flex-wrap">
                                            <button onClick={() => setExpandedMatch(expandedMatch === match._id ? null : match._id)}
                                                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs transition-colors">
                                                {expandedMatch === match._id ? '▲ Close' : '▼ Details'}
                                            </button>
                                            {match.status === 'upcoming' && (
                                                <button onClick={() => changeStatus(match._id, 'live')}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs transition-colors">
                                                    ▶ Go Live
                                                </button>
                                            )}
                                            {match.status === 'live' && (
                                                <button onClick={() => changeStatus(match._id, 'completed')}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs transition-colors">
                                                    ✅ Complete
                                                </button>
                                            )}
                                            {(match.status === 'upcoming' || match.status === 'live') && (
                                                <button onClick={() => changeStatus(match._id, 'cancelled')}
                                                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-xs transition-colors">
                                                    ⛔ Cancel
                                                </button>
                                            )}
                                            <button onClick={() => deleteMatch(match._id, match.title)}
                                                className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-2 rounded-lg text-xs border border-red-500/30 transition-all">
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedMatch === match._id && (
                                        <div className="border-t border-gray-700/50 bg-gray-900/30 p-5 space-y-4">
                                            {/* Room Credentials */}
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-gray-500 block mb-1">Room ID</label>
                                                    <input className="input text-sm" placeholder="Room ID"
                                                        defaultValue={match.room_id}
                                                        id={`room-${match._id}`} />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 block mb-1">Room Password</label>
                                                    <input className="input text-sm" placeholder="Password"
                                                        defaultValue={match.room_password}
                                                        id={`pass-${match._id}`} />
                                                </div>
                                            </div>
                                            <button onClick={() => updateMatch(match._id, {
                                                room_id: document.getElementById(`room-${match._id}`).value,
                                                room_password: document.getElementById(`pass-${match._id}`).value
                                            })} className="btn-primary text-sm py-2">
                                                🔑 Update Room Credentials
                                            </button>

                                            {/* ─── Edit Match Fields ─── */}
                                            <div className="border-t border-gray-700/30 pt-4">
                                                <h4 className="text-white font-bold text-sm mb-3">✏️ Edit Match Details</h4>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">Entry Fee</label>
                                                        <input type="number" className="input text-sm" defaultValue={match.entry_fee} id={`fee-${match._id}`} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">Prize Pool</label>
                                                        <input type="number" className="input text-sm" defaultValue={match.prize_pool} id={`prize-${match._id}`} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">Per Kill</label>
                                                        <input type="number" className="input text-sm" defaultValue={match.per_kill} id={`kill-${match._id}`} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">Max Players</label>
                                                        <input type="number" className="input text-sm" defaultValue={match.max_participants} id={`max-${match._id}`} />
                                                    </div>
                                                </div>
                                                <button onClick={() => updateMatch(match._id, {
                                                    entry_fee: Number(document.getElementById(`fee-${match._id}`).value),
                                                    prize_pool: Number(document.getElementById(`prize-${match._id}`).value),
                                                    per_kill: Number(document.getElementById(`kill-${match._id}`).value),
                                                    max_participants: Number(document.getElementById(`max-${match._id}`).value),
                                                })} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                                                    💾 Save Changes
                                                </button>
                                            </div>

                                            {/* ─── Participants ─── */}
                                            <div className="border-t border-gray-700/30 pt-4">
                                                <h4 className="text-white font-bold text-sm mb-3">
                                                    👥 Participants ({match.participantCount})
                                                </h4>
                                                {match.participants.length === 0 ? (
                                                    <p className="text-gray-500 text-sm">No participants yet</p>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead className="text-gray-500 text-xs border-b border-gray-700/50">
                                                                <tr>
                                                                    <th className="text-left py-2 px-2">#</th>
                                                                    <th className="text-left py-2 px-2">Username</th>
                                                                    <th className="text-left py-2 px-2">BGMI Name</th>
                                                                    <th className="text-left py-2 px-2">Joined</th>
                                                                    <th className="text-left py-2 px-2">Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {match.participants.map((p, i) => (
                                                                    <tr key={p._id || i} className="border-b border-gray-800/30 hover:bg-gray-700/20">
                                                                        <td className="py-2 px-2 text-gray-500">{i + 1}</td>
                                                                        <td className="py-2 px-2 text-white">{p.user?.username || 'Unknown'}</td>
                                                                        <td className="py-2 px-2 text-yellow-400">{p.bgmi_name || '—'}</td>
                                                                        <td className="py-2 px-2 text-gray-500 text-xs">{new Date(p.joinedAt).toLocaleString()}</td>
                                                                        <td className="py-2 px-2">
                                                                            {match.status !== 'completed' && (
                                                                                <button onClick={() => removeParticipant(match._id, p.user?._id, p.user?.username)}
                                                                                    className="text-red-400 hover:text-red-300 text-xs transition-colors">
                                                                                    ✕ Remove
                                                                                </button>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══════ DEPOSITS TAB ═══════ */}
                {activeTab === 'deposits' && (
                    <div className="card">
                        <h2 className="text-xl font-bold text-white mb-4">💰 Pending Deposits</h2>
                        {pendingDeposits.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-5xl mb-4">✅</div>
                                <p className="text-gray-400">No pending deposits — all caught up!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingDeposits.map(dep => (
                                    <div key={dep._id} className="bg-gray-700/30 border border-gray-700/50 rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                        <div>
                                            <p className="text-white font-bold text-xl">₹{dep.amount}</p>
                                            <p className="text-gray-400 text-sm">👤 {dep.user?.username} ({dep.user?.email})</p>
                                            <p className="text-blue-400 text-sm font-mono">TXN: {dep.transaction_id}</p>
                                            <p className="text-gray-500 text-xs mt-1">{new Date(dep.createdAt).toLocaleString()}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => verifyDeposit(dep._id, 'approve')}
                                                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-bold transition-colors">✓ Approve</button>
                                            <button onClick={() => verifyDeposit(dep._id, 'reject')}
                                                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-bold transition-colors">✕ Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════ USERS TAB ═══════ */}
                {activeTab === 'users' && (
                    <div className="space-y-8">
                        <div className="card">
                            <h2 className="text-xl font-bold text-white mb-4">➕ Create New User</h2>
                            <form onSubmit={createUser} className="grid sm:grid-cols-2 gap-4">
                                <input placeholder="Username" className="input" required minLength={3}
                                    value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
                                <input placeholder="Email" type="email" className="input" required
                                    value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                                <input placeholder="Password" type="password" className="input" required minLength={6}
                                    value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                                <select className="input" value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <input placeholder="Initial Balance ₹" type="number" className="input" min={0}
                                    value={newUser.wallet_balance} onChange={e => setNewUser({ ...newUser, wallet_balance: Number(e.target.value) })} />
                                <button type="submit" className="btn-success">Create User</button>
                            </form>
                        </div>

                        <div className="card">
                            <h2 className="text-xl font-bold text-white mb-4">👥 All Users ({allUsers.length})</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                                        <tr>
                                            <th className="py-3 px-2">Username</th>
                                            <th className="py-3 px-2">Email</th>
                                            <th className="py-3 px-2">Role</th>
                                            <th className="py-3 px-2">Balance</th>
                                            <th className="py-3 px-2">BGMI ID</th>
                                            <th className="py-3 px-2">Joined</th>
                                            <th className="py-3 px-2">Add Money</th>
                                            <th className="py-3 px-2">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allUsers.map(u => (
                                            <tr key={u._id} className="border-b border-gray-800/50 hover:bg-gray-700/20 transition-colors">
                                                <td className="py-3 px-2 text-white font-medium">{u.username}</td>
                                                <td className="py-3 px-2 text-gray-400 text-xs">{u.email}</td>
                                                <td className="py-3 px-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' :
                                                            'bg-gray-600/20 text-gray-300 border border-gray-500/30'
                                                        }`}>{u.role}</span>
                                                </td>
                                                <td className="py-3 px-2 text-green-400 font-bold">₹{u.wallet_balance || 0}</td>
                                                <td className="py-3 px-2 text-gray-500">{u.bgmi_id || '—'}</td>
                                                <td className="py-3 px-2 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                                                <td className="py-3 px-2">
                                                    <div className="flex gap-1">
                                                        <input type="number" placeholder="₹" className="input text-xs py-1 px-2 w-20"
                                                            value={walletEdit[u._id] || ''}
                                                            onChange={e => setWalletEdit({ ...walletEdit, [u._id]: e.target.value })} />
                                                        <button onClick={() => updateWallet(u._id)}
                                                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors">+Add</button>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    {u.role !== 'admin' && u.role !== 'superadmin' ? (
                                                        <button onClick={() => deleteUser(u._id, u.username)}
                                                            className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1 rounded text-xs border border-red-500/30 transition-all">Delete</button>
                                                    ) : (
                                                        <span className="text-gray-600 text-xs">Protected</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════ SETTINGS TAB ═══════ */}
                {activeTab === 'settings' && (
                    <div className="card max-w-xl">
                        <h2 className="text-xl font-bold text-white mb-4">⚙️ UPI Payment Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-gray-400 text-sm block mb-1">UPI ID</label>
                                <input type="text" value={upiSettings.upi_id}
                                    onChange={e => setUpiSettings({ ...upiSettings, upi_id: e.target.value })}
                                    placeholder="yourname@upi" className="input" />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm block mb-1">QR Code URL (optional)</label>
                                <input type="text" value={upiSettings.qr_code}
                                    onChange={e => setUpiSettings({ ...upiSettings, qr_code: e.target.value })}
                                    placeholder="https://example.com/qr.png" className="input" />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm block mb-1">Minimum Deposit (₹)</label>
                                <input type="number" value={upiSettings.min_deposit} min={1}
                                    onChange={e => setUpiSettings({ ...upiSettings, min_deposit: Number(e.target.value) })}
                                    className="input" />
                            </div>
                            <button onClick={saveUpiSettings} className="w-full btn-success">💾 Save Settings</button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
