export default function MatchCard({ match, onJoin, isJoined, user }) {
    const timeDiff = new Date(match.match_time) - new Date();
    const minutesLeft = Math.floor(timeDiff / 1000 / 60);
    const hoursLeft = Math.floor(minutesLeft / 60);
    const isFull = match.participantCount >= (match.max_participants || 100);
    const fillPercent = Math.min(((match.participantCount || 0) / (match.max_participants || 100)) * 100, 100);

    return (
        <div className="card card-hover group h-full flex flex-col">
            <div className="flex justify-between items-center mb-3">
                <span className="bg-yellow-500/90 text-black px-3 py-1 text-xs font-bold rounded-full">
                    {match.map}
                </span>
                <span className="bg-blue-600/90 text-white px-3 py-1 text-xs font-bold rounded-full">
                    {match.type}
                </span>
            </div>

            <h2 className="text-xl font-heading font-bold text-white mb-2 group-hover:text-gradient transition-all line-clamp-1">
                {match.title}
            </h2>

            <div className="text-gray-400 text-sm mb-4">
                {hoursLeft > 0 ? `⏰ Starts in ${hoursLeft}h ${minutesLeft % 60}m` :
                    minutesLeft > 0 ? `⏰ Starts in ${minutesLeft}m` : '🔴 Starting soon!'}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-gray-700/50 rounded-lg p-2">
                    <div className="text-green-400 font-bold text-lg font-heading">₹{match.prize_pool}</div>
                    <div className="text-xs text-gray-500">Prize Pool</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-2">
                    <div className="text-yellow-400 font-bold text-lg font-heading">₹{match.entry_fee}</div>
                    <div className="text-xs text-gray-500">Entry Fee</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-2">
                    <div className="text-blue-400 font-bold text-lg font-heading">₹{match.per_kill}</div>
                    <div className="text-xs text-gray-500">Per Kill</div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4 flex-grow">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>👥 {match.participantCount || 0}/{match.max_participants || 100}</span>
                    <span className="text-xs">{new Date(match.match_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-700"
                        style={{ width: `${fillPercent}%` }}></div>
                </div>
            </div>

            {match.room_id && match.room_id !== 'Hidden' && (
                <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-3 mb-4 text-center animate-pulse">
                    <div className="text-green-400 font-bold">🔑 Room ID: {match.room_id}</div>
                    <div className="text-green-400">🔒 Password: {match.room_password}</div>
                </div>
            )}

            <div className="mt-auto">
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
        </div>
    );
}
