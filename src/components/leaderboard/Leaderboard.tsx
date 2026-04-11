interface LeaderboardEntry {
  profile: {
    id: string;
    discord_username: string;
    discord_avatar_url: string | null;
  };
  total: number;
  nose: number;
  taste: number;
  pending: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
  nosingEnabled: boolean;
}

const RANK_COLORS = ['text-yellow-500', 'text-stone-400', 'text-amber-700'];

export function Leaderboard({ entries, currentUserId, nosingEnabled }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-400">
        No scores yet.
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem_4rem] px-5 py-2.5 text-xs text-stone-400 font-medium border-b border-stone-100">
        <span>#</span>
        <span>Participant</span>
        {nosingEnabled && <span className="text-right">Nose</span>}
        {nosingEnabled && <span className="text-right">Palate</span>}
        <span className="text-right">Total</span>
      </div>
      <div className="divide-y divide-stone-50">
        {entries.map((entry, idx) => {
          const isCurrentUser = entry.profile.id === currentUserId;
          const rankColor = RANK_COLORS[idx] ?? 'text-stone-600';

          return (
            <div
              key={entry.profile.id}
              className={`grid grid-cols-[2.5rem_1fr_4rem_4rem_4rem] px-5 py-3 items-center ${
                isCurrentUser ? 'bg-stone-50' : ''
              }`}
            >
              <span className={`text-sm font-bold ${rankColor}`}>{idx + 1}</span>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-600 shrink-0">
                  {entry.profile.discord_username[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-stone-800">
                  {entry.profile.discord_username}
                  {isCurrentUser && <span className="text-stone-400 ml-1 text-xs">(you)</span>}
                </span>
              </div>
              {nosingEnabled && (
                <span className="text-right text-sm text-stone-600">{entry.nose}</span>
              )}
              {nosingEnabled && (
                <span className="text-right text-sm text-stone-600">{entry.taste}</span>
              )}
              <span className="text-right text-sm font-semibold text-stone-900">
                {entry.total}
                {entry.pending > 0 && <span className="text-amber-500 ml-0.5 text-xs">+?</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
