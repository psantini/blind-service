'use client';

import { useTransition } from 'react';
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
}

const STATUS_BADGE: Record<BlindStatus, { label: string; variant: 'green' | 'amber' | 'grey' }> = {
  active:   { label: 'Active',    variant: 'green' },
  setup:    { label: 'Setup',     variant: 'amber' },
  complete: { label: 'Complete',  variant: 'grey'  },
};

export function BlindLobby({ blind, currentUserId, isHost, isMember, firstSampleId }: BlindLobbyProps) {
  const [isPending, startTransition] = useTransition();
  const badge = STATUS_BADGE[blind.status];
  const samples = [...blind.samples].sort((a, b) => a.display_order - b.display_order);

  function handleJoin() {
    startTransition(() => joinBlind(blind.id));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-stone-900">{blind.name}</h1>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-sm text-stone-500 mt-1">
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
            <Button onClick={handleJoin} disabled={isPending}>
              {isPending ? 'Joining...' : 'Join blind'}
            </Button>
          )}
          {!isHost && isMember && blind.status === 'active' && firstSampleId && (
            <Link href={`/blinds/${blind.id}/taste/${firstSampleId}`}>
              <Button>Start tasting →</Button>
            </Link>
          )}
          {blind.status === 'complete' && (
            <Link href={`/blinds/${blind.id}/leaderboard`}>
              <Button variant="secondary" size="sm">View results</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-4">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
          Members ({blind.blind_members.length})
        </p>
        <div className="space-y-2">
          {blind.blind_members.map(m => (
            <div key={m.user_id} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-600 shrink-0">
                {m.profile?.discord_username[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-stone-800">
                {m.profile?.discord_username}
                {m.user_id === currentUserId && (
                  <span className="text-stone-400 ml-1">(you)</span>
                )}
              </span>
              {m.role === 'host' && (
                <Badge variant="default" className="ml-auto">host</Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {samples.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
            Samples ({samples.length})
          </p>
          <div className="flex gap-2 flex-wrap">
            {samples.map(s => (
              <span
                key={s.id}
                className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-sm font-semibold text-stone-700"
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
