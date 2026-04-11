import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { BlindStatus } from '@/types';

interface BlindCardProps {
  blind: {
    id: string;
    name: string;
    status: BlindStatus;
    nosing_enabled: boolean;
    created_at: string;
    host: { id: string; discord_username: string; discord_avatar_url: string | null } | null;
    blind_members: Array<{
      user_id: string;
      role: string;
      profile: { id: string; discord_username: string; discord_avatar_url: string | null } | null;
    }>;
    samples: Array<{ id: string }>;
  };
  currentUserId: string;
}

const STATUS_BADGE: Record<BlindStatus, { label: string; variant: 'green' | 'amber' | 'grey' }> = {
  active:   { label: 'Active',    variant: 'green' },
  setup:    { label: 'Setup',     variant: 'amber' },
  complete: { label: 'Complete',  variant: 'grey'  },
};

function Avatar({ username, url }: { username: string; url: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt={username}
        className="w-6 h-6 rounded-full object-cover border border-white"
      />
    );
  }
  return (
    <div className="w-6 h-6 rounded-full bg-stone-300 flex items-center justify-center text-[10px] font-bold text-stone-700 border border-white">
      {username[0]?.toUpperCase()}
    </div>
  );
}

export function BlindCard({ blind, currentUserId }: BlindCardProps) {
  const currentMember = blind.blind_members.find(m => m.user_id === currentUserId);
  const isHost = currentMember?.role === 'host';
  const badge = STATUS_BADGE[blind.status];
  const sampleCount = blind.samples.length;
  const roundType = blind.nosing_enabled ? 'Nose + Taste' : 'Taste only';
  const visibleMembers = blind.blind_members.slice(0, 4);
  const overflowCount = blind.blind_members.length - 4;

  return (
    <Link href={`/blinds/${blind.id}`} className="block">
      <div className="bg-white border border-stone-200 rounded-xl px-5 py-4 hover:border-stone-300 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-stone-900 truncate">{blind.name}</span>
              {isHost && (
                <Badge variant="default">host</Badge>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {sampleCount} sample{sampleCount !== 1 ? 's' : ''} · {roundType}
              {blind.host && ` · hosted by ${blind.host.discord_username}`}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant={badge.variant}>{badge.label}</Badge>

            <div className="flex items-center gap-1">
              <div className="flex -space-x-1.5">
                {visibleMembers.map(m => (
                  <Avatar
                    key={m.user_id}
                    username={m.profile?.discord_username ?? '?'}
                    url={m.profile?.discord_avatar_url ?? null}
                  />
                ))}
              </div>
              {overflowCount > 0 && (
                <span className="text-xs text-stone-500">+{overflowCount}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
