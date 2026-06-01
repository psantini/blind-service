'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { joinBlind } from '@/app/blinds/[blindId]/actions';
import { BlindStatus } from '@/types';

interface Member {
  user_id: string;
  role: string;
  joined_at: string;
  profile: { id: string; discord_username: string; discord_avatar_url: string | null } | null;
}

interface Sample {
  id: string;
  label: string;
  display_order: number;
}

interface BlindLobbyProps {
  blind: {
    id: string;
    name: string;
    status: BlindStatus;
    nosing_enabled: boolean;
    host_id: string;
    host: { id: string; discord_username: string } | null;
    blind_members: Member[];
    samples: Sample[];
  };
  currentUserId: string;
  isHost: boolean;
  isMember: boolean;
  firstSampleId: string | null;
  revealedSampleIds: Set<string>;
  nosedSampleIds: Set<string>;
}

const STATUS_BADGE: Record<BlindStatus, { label: string; variant: 'green' | 'amber' | 'grey' }> = {
  active:   { label: 'Active',    variant: 'green' },
  setup:    { label: 'Setup',     variant: 'amber' },
  complete: { label: 'Complete',  variant: 'grey'  },
};

export function BlindLobby({ blind, currentUserId, isHost, isMember, firstSampleId, revealedSampleIds, nosedSampleIds }: BlindLobbyProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const badge = STATUS_BADGE[blind.status];
  const samples = [...blind.samples].sort((a, b) => a.display_order - b.display_order);

  const [joinError, setJoinError] = useState<string | null>(null);

  function handleJoin() {
    setJoinError(null);
    startTransition(async () => {
      const result = await joinBlind(blind.id);
      if (result?.error) { setJoinError(result.error); return; }
      if (!result?.redirectTo) return;
      if (result.redirectTo === window.location.pathname) {
        router.refresh();
      } else {
        router.push(result.redirectTo);
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-display italic font-bold text-parchment">{blind.name}</h1>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-sm text-smoke mt-1">
            {samples.length} sample{samples.length !== 1 ? 's' : ''} ·{' '}
            {blind.nosing_enabled ? 'Nose + Taste' : 'Taste only'} ·{' '}
            hosted by {blind.host?.discord_username}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {isHost && (
            <>
              <Link href={`/blinds/${blind.id}/host/setup`}>
                <Button variant="secondary" size="sm">Edit setup</Button>
              </Link>
              <Link href={`/blinds/${blind.id}/host`}>
                <Button size="sm">Host dashboard</Button>
              </Link>
            </>
          )}
          {!isHost && !isMember && blind.status === 'active' && (
            <div className="flex flex-col items-end gap-1">
              <Button onClick={handleJoin} disabled={isPending}>
                {isPending ? 'Joining...' : 'Join blind'}
              </Button>
              {joinError && <p className="text-xs text-red-400">{joinError}</p>}
            </div>
          )}
          {!isHost && isMember && blind.status === 'active' && firstSampleId && (
            <Link href={`/blinds/${blind.id}/taste/${firstSampleId}`}>
              <Button>Continue tasting →</Button>
            </Link>
          )}
          {!isMember && blind.status === 'complete' && (
            <Link href={`/blinds/${blind.id}/leaderboard`}>
              <Button variant="secondary" size="sm">View results</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="bg-cream rounded-xl p-5 mb-4" style={{ border: '0.5px solid #E5DDD0' }}>
        <p className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-3">
          Members ({blind.blind_members.length})
        </p>
        <div className="space-y-2">
          {blind.blind_members.map(m => (
            <div key={m.user_id} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#E5DDD0] flex items-center justify-center text-xs font-bold text-[#0D0D0D] shrink-0">
                {m.profile?.discord_username[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-[#0D0D0D]">
                {m.profile?.discord_username}
                {m.user_id === currentUserId && (
                  <span className="text-[#999] ml-1">(you)</span>
                )}
              </span>
              {m.role === 'host' && (
                <Badge variant="default" className="ml-auto">host</Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {samples.length > 0 && isMember && (
        <div className="bg-cream rounded-xl p-5" style={{ border: '0.5px solid #E5DDD0' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[#666] uppercase tracking-wider">Your progress</p>
            <p className="text-xs text-[#999]">{revealedSampleIds.size} of {samples.length} revealed</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {samples.map(s => {
              const isRevealed = revealedSampleIds.has(s.id);
              const isNosed = nosedSampleIds.has(s.id) && !isRevealed;

              const circle = (
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 overflow-hidden transition-colors ${
                    isRevealed
                      ? 'bg-amber border-amber text-black'
                      : isNosed
                      ? 'border-amber text-parchment'
                      : 'bg-[#EDE7D5] border-[#E5DDD0] text-[#0D0D0D]'
                  }`}
                  style={isNosed ? { background: 'linear-gradient(to bottom, #C9973F 50%, #0D0D0D 50%)' } : undefined}
                >
                  {isRevealed ? '✓' : s.label}
                </div>
              );

              if (isRevealed) {
                return (
                  <Link key={s.id} href={`/blinds/${blind.id}/taste/${s.id}`} title={`Review Sample ${s.label}`}>
                    {circle}
                  </Link>
                );
              }
              return <div key={s.id}>{circle}</div>;
            })}
          </div>
        </div>
      )}

      {samples.length > 0 && !isMember && (
        <div className="bg-cream rounded-xl p-5" style={{ border: '0.5px solid #E5DDD0' }}>
          <p className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-3">
            Samples ({samples.length})
          </p>
          <div className="flex gap-2 flex-wrap">
            {samples.map(s => (
              <div
                key={s.id}
                className="w-9 h-9 rounded-full bg-[#EDE7D5] border-2 border-[#E5DDD0] flex items-center justify-center text-sm font-semibold text-[#0D0D0D]"
              >
                {s.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
