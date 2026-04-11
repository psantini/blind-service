'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { reviewFuzzyAnswer, completeBlind } from '@/app/blinds/[blindId]/host/actions';
import { FuzzyReviewPanel } from '@/components/scoring/FuzzyReviewPanel';
import { SubmissionTracker } from './SubmissionTracker';
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
  currentUserId: string;
}

const STATUS_BADGE: Record<BlindStatus, { label: string; variant: 'green' | 'amber' | 'grey' }> = {
  active:   { label: 'Active',    variant: 'green' },
  setup:    { label: 'Setup',     variant: 'amber' },
  complete: { label: 'Complete',  variant: 'grey'  },
};

export function HostDashboard({ blind, fuzzyAnswers, currentUserId }: HostDashboardProps) {
  const [isPending, startTransition] = useTransition();
  const badge = STATUS_BADGE[blind.status];
  const samples = [...blind.samples].sort((a, b) => a.display_order - b.display_order);
  const participants = blind.blind_members.filter(m => m.role === 'participant');
  const fullySubmitted = participants.filter(p =>
    samples.every(s =>
      s.sample_reveals.some(r => r.user_id === p.user_id)
    )
  ).length;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/blinds/${blind.id}`
    : `/blinds/${blind.id}`;

  function handleCopyLink() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/blinds/${blind.id}`);
    }
  }

  function handleComplete() {
    startTransition(() => completeBlind(blind.id));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-stone-900">{blind.name}</h1>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-sm text-stone-500 mt-1">
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
          <div key={card.label} className="bg-white border border-stone-200 rounded-xl p-4">
            <p className={`text-2xl font-bold ${card.amber ? 'text-amber-600' : 'text-stone-900'}`}>
              {card.value}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission tracker */}
        <SubmissionTracker samples={samples} participants={participants} />

        {/* Right column */}
        <div className="space-y-4">
          {/* Fuzzy review */}
          <FuzzyReviewPanel
            blindId={blind.id}
            answers={fuzzyAnswers}
          />
        </div>
      </div>
    </div>
  );
}
