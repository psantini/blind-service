'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { reviewFuzzyAnswer, completeBlind } from '@/app/blinds/[blindId]/host/actions';
import { FuzzyReviewPanel } from '@/components/scoring/FuzzyReviewPanel';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { SampleBreakdown } from '@/components/leaderboard/SampleBreakdown';
import { BlindStatus } from '@/types';

interface HostDashboardProps {
  blind: {
    id: string;
    name: string;
    status: BlindStatus;
    nosing_enabled: boolean;
    samples: Array<{
      id: string;
      label: string;
      display_order: number;
      sample_reveals: Array<{ user_id: string; revealed_at: string }>;
    }>;
    blind_members: Array<{
      user_id: string;
      role: string;
      profile: { id: string; discord_username: string; discord_avatar_url: string | null } | null;
    }>;
  };
  ranked: Array<{
    profile: { id: string; discord_username: string; discord_avatar_url: string | null };
    total: number;
    nose: number;
    taste: number;
    pending: number;
  }>;
  allAnswers: Array<{
    user_id: string;
    question_id: string;
    value: string | null;
    points_earned: number | null;
    fuzzy_flagged: boolean;
    host_approved: boolean | null;
    question: {
      attribute: { name: string; value: string; sample_id: string } | null;
    } | null;
  }>;
  fuzzyAnswers: Array<{
    id: string;
    value: string;
    host_approved: boolean | null;
    user_id: string;
    profile: { discord_username: string } | null;
    question: {
      round: string;
      attribute: {
        name: string;
        value: string;
        sample: { label: string } | null;
      } | null;
    } | null;
  }>;
  sampleBreakdowns: Array<{
    id: string;
    label: string;
    attributes: Array<{
      questionId: string;
      attrId: string;
      name: string;
      correctValue: string;
      round: 'nose' | 'taste';
      scoringType: 'exact' | 'bracket' | 'none';
    }>;
  }>;
  answerMap: Record<string, Record<string, { answerId: string; value: string | null; points: number | null; fuzzyPending: boolean; hostApproved: boolean | null }>>;
  players: Array<{ id: string; discord_username: string }>;
  currentUserId: string;
  onOverride: (answerId: string, approved: boolean) => Promise<void>;
}

const STATUS_BADGE: Record<BlindStatus, { label: string; variant: 'green' | 'amber' | 'grey' }> = {
  active:   { label: 'Active',    variant: 'green' },
  setup:    { label: 'Setup',     variant: 'amber' },
  complete: { label: 'Complete',  variant: 'grey'  },
};

export function HostDashboard({ blind, fuzzyAnswers, allAnswers, ranked, currentUserId, sampleBreakdowns, answerMap, players, onOverride }: HostDashboardProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const badge = STATUS_BADGE[blind.status];
  const samples = [...blind.samples].sort((a, b) => a.display_order - b.display_order);
  const participants = blind.blind_members.filter(m => m.role === 'participant');
  const fullySubmitted = participants.filter(p =>
    samples.every(s =>
      s.sample_reveals.some(r => r.user_id === p.user_id)
    )
  ).length;

  function handleCopyLink() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/blinds/${blind.id}`);
    }
  }

  function handleComplete() {
    startTransition(async () => {
      const result = await completeBlind(blind.id);
      if (result?.redirectTo) {
        router.push(result.redirectTo);
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-display italic font-bold text-parchment">{blind.name}</h1>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-sm text-smoke mt-1">
            {samples.length} samples · {blind.nosing_enabled ? 'Nose + Taste' : 'Taste only'} · {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={handleCopyLink}>
            Copy link
          </Button>
          <Link href={`/blinds/${blind.id}/host/setup`}>
            <Button variant="secondary" size="sm">Edit setup</Button>
          </Link>
          {blind.status !== 'complete' && (
            <Button variant="danger" size="sm" onClick={handleComplete} disabled={isPending}>
              Mark complete
            </Button>
          )}
          {blind.status === 'complete' && (
            <Link href={`/blinds/${blind.id}/leaderboard`}>
              <Button size="sm">View leaderboard</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Participants', value: participants.length },
          { label: 'Fully submitted', value: fullySubmitted },
          { label: 'Fuzzy pending', value: fuzzyAnswers.length, amber: fuzzyAnswers.length > 0 },
          { label: 'Samples', value: samples.length },
        ].map(card => (
          <div key={card.label} className="bg-cream rounded-xl p-4" style={{ border: '0.5px solid #E5DDD0' }}>
            <p className={`text-2xl font-bold ${card.amber ? 'text-amber' : 'text-[#0D0D0D]'}`}>
              {card.value}
            </p>
            <p className="text-xs text-[#666] mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Fuzzy review */}
      {fuzzyAnswers.length > 0 && (
        <div className="mb-8">
          <FuzzyReviewPanel
            blindId={blind.id}
            answers={fuzzyAnswers}
          />
        </div>
      )}

      {/* Live standings */}
      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-3">
            Live standings
          </p>
          <Leaderboard
            entries={ranked}
            currentUserId={currentUserId}
            nosingEnabled={blind.nosing_enabled}
          />
        </div>

        <SampleBreakdown
          samples={sampleBreakdowns}
          players={players}
          answerMap={answerMap}
          nosingEnabled={blind.nosing_enabled}
          onOverride={onOverride}
        />
      </div>
    </div>
  );
}
