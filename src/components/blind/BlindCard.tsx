import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { GroupBadge } from '@/components/ui/GroupBadge';
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
    group?: { name: string; icon_url: string | null } | null;
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
        className="w-6 h-6 rounded-full object-cover border border-[#E5DDD0]"
      />
    );
  }
  return (
    <div className="w-6 h-6 rounded-full bg-[#E5DDD0] flex items-center justify-center text-[10px] font-bold text-[#0D0D0D] border border-[#E5DDD0]">
      {username[0]?.toUpperCase()}
    </div>
  );
}

export function BlindCard({ blind, currentUserId, adventId }: BlindCardProps & { adventId?: string }) {
  const currentMember = blind.blind_members.find(m => m.user_id === currentUserId);
  const isHost = currentMember?.role === 'host';
  const badge = STATUS_BADGE[blind.status];
  const sampleCount = blind.samples.length;
  const roundType = blind.nosing_enabled ? 'Nose + Taste' : 'Taste only';
  const visibleMembers = blind.blind_members.slice(0, 4);
  const overflowCount = blind.blind_members.length - 4;
  const group = blind.group ?? null;

  const href = adventId && blind.status === 'setup'
    ? `/advent/${adventId}`
    : `/blinds/${blind.id}`;

  return (
    <Link href={href} className="block">
      <div className="bg-cream rounded-xl px-5 py-4 hover:border-[#C9B99A] transition-colors" style={{ border: '0.5px solid #E5DDD0' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-[#0D0D0D] truncate">{blind.name}</span>
              {isHost && (
                <Badge variant="default">host</Badge>
              )}
            </div>
            <p className="text-xs text-[#666] mt-1 flex items-center gap-1.5 flex-wrap">
              <span>{sampleCount} sample{sampleCount !== 1 ? 's' : ''} · {roundType}{blind.host && ` · hosted by ${blind.host.discord_username}`}</span>
              {group && <GroupBadge group={group} />}
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
                <span className="text-xs text-[#666]">+{overflowCount}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
