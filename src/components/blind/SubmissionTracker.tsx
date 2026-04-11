'use client';

import { useState } from 'react';

interface Sample {
  id: string;
  label: string;
  display_order: number;
  sample_reveals: Array<{ user_id: string; revealed_at: string }>;
}

interface Participant {
  user_id: string;
  role: string;
  profile: { id: string; discord_username: string; discord_avatar_url: string | null } | null;
}

interface SubmissionTrackerProps {
  samples: Sample[];
  participants: Participant[];
}

export function SubmissionTracker({ samples, participants }: SubmissionTrackerProps) {
  const [activeSampleIdx, setActiveSampleIdx] = useState(0);
  const activeSample = samples[activeSampleIdx];

  function dotColor(sample: Sample): string {
    const submittedCount = sample.sample_reveals.length;
    if (submittedCount === 0) return 'bg-stone-300';
    if (submittedCount >= participants.length) return 'bg-green-500';
    return 'bg-amber-400';
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      <div className="px-5 pt-4 pb-0">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
          Submission tracker
        </p>
        <div className="flex gap-1 overflow-x-auto pb-3">
          {samples.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveSampleIdx(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                i === activeSampleIdx
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${i === activeSampleIdx ? 'bg-white/50' : dotColor(s)}`} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-stone-100">
        {participants.length === 0 ? (
          <p className="px-5 py-4 text-sm text-stone-400">No participants yet.</p>
        ) : (
          participants.map(p => {
            const revealed = activeSample?.sample_reveals.find(r => r.user_id === p.user_id);
            return (
              <div key={p.user_id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-600 shrink-0">
                    {p.profile?.discord_username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">{p.profile?.discord_username}</p>
                    <p className="text-xs text-stone-400">
                      {revealed
                        ? `Submitted ${new Date(revealed.revealed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Not submitted'}
                    </p>
                  </div>
                </div>
                {revealed ? (
                  <span className="text-green-500 text-base">✓</span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-stone-300" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
