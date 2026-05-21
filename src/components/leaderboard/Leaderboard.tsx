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

const RANK_COLORS = ['text-yellow-400', 'text-muted', 'text-amber'];

export function Leaderboard({ entries, currentUserId, nosingEnabled }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-cream rounded-xl p-8 text-center text-[#999]" style={{ border: '0.5px solid #E5DDD0' }}>
        No scores yet.
      </div>
    );
  }

  return (
    <div className="bg-cream rounded-xl overflow-hidden" style={{ border: '0.5px solid #E5DDD0' }}>
      <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem_4rem] px-5 py-2.5 text-xs text-[#999] font-medium" style={{ borderBottom: '0.5px solid #E5DDD0' }}>
        <span>#</span>
        <span>Participant</span>
        {nosingEnabled && <span className="text-right">Nose</span>}
        {nosingEnabled && <span className="text-right">Palate</span>}
        <span className="text-right">Total</span>
      </div>
      <div className="divide-y divide-[#E5DDD0]">
        {entries.map((entry, idx) => {
          const isCurrentUser = entry.profile.id === currentUserId;
          const rankColor = RANK_COLORS[idx] ?? 'text-[#666]';

          return (
            <div
              key={entry.profile.id}
              className={`grid grid-cols-[2.5rem_1fr_4rem_4rem_4rem] px-5 py-3 items-center ${
                isCurrentUser ? 'bg-[#EDE7D5]' : ''
              }`}
            >
              <span className={`text-sm font-bold ${rankColor}`}>{idx + 1}</span>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#E5DDD0] flex items-center justify-center text-xs font-bold text-[#0D0D0D] shrink-0">
                  {entry.profile.discord_username[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-[#0D0D0D]">
                  {entry.profile.discord_username}
                  {isCurrentUser && <span className="text-[#999] ml-1 text-xs">(you)</span>}
                </span>
              </div>
              {nosingEnabled && (
                <span className="text-right text-sm text-[#666]">{entry.nose}</span>
              )}
              {nosingEnabled && (
                <span className="text-right text-sm text-[#666]">{entry.taste}</span>
              )}
              <span className="text-right text-sm font-semibold text-[#0D0D0D]">
                {entry.total}
                {entry.pending > 0 && <span className="text-amber ml-0.5 text-xs">+?</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
