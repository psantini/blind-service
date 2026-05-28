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

interface Answer {
  user_id: string;
  question_id: string;
  value: string | null;
  points_earned: number | null;
  fuzzy_flagged: boolean;
  host_approved: boolean | null;
  question: {
    attribute: { name: string; value: string; sample_id: string } | null;
  } | null;
}

interface SubmissionTrackerProps {
  samples: Sample[];
  participants: Participant[];
  allAnswers: Answer[];
}

function GuessModal({
  participant,
  sample,
  answers,
  onClose,
}: {
  participant: Participant;
  sample: Sample;
  answers: Answer[];
  onClose: () => void;
}) {
  const sampleAnswers = answers
    .filter(a => a.user_id === participant.user_id && a.question?.attribute?.sample_id === sample.id)
    .sort((a, b) => (a.question?.attribute?.name ?? '').localeCompare(b.question?.attribute?.name ?? ''));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="bg-cream rounded-2xl w-full max-w-sm overflow-hidden"
        style={{ border: '0.5px solid #E5DDD0' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4" style={{ borderBottom: '0.5px solid #E5DDD0' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#999]">Sample {sample.label}</p>
              <p className="text-sm font-semibold text-[#0D0D0D]">{participant.profile?.discord_username}</p>
            </div>
            <button
              onClick={onClose}
              className="text-[#999] hover:text-[#0D0D0D] transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="divide-y divide-[#E5DDD0]">
          {sampleAnswers.length === 0 ? (
            <p className="px-5 py-4 text-sm text-[#999]">No answers recorded.</p>
          ) : (
            sampleAnswers.map(a => {
              const attr = a.question?.attribute;
              const pts = a.fuzzy_flagged && a.host_approved === null ? null : a.points_earned;
              return (
                <div key={a.question_id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#666] capitalize mb-0.5">{attr?.name}</p>
                      <p className="text-sm text-[#0D0D0D] truncate">{a.value || <span className="text-[#999] italic">blank</span>}</p>
                      <p className="text-xs text-[#999] mt-0.5">Correct: {attr?.value}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {pts !== null ? (
                        <span className={`text-sm font-semibold ${pts > 0 ? 'text-green-600' : 'text-[#999]'}`}>
                          {pts} pt{pts !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-amber font-medium">fuzzy</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export function SubmissionTracker({ samples, participants, allAnswers }: SubmissionTrackerProps) {
  const [activeSampleIdx, setActiveSampleIdx] = useState(0);
  const [selected, setSelected] = useState<{ participant: Participant; sample: Sample } | null>(null);
  const activeSample = samples[activeSampleIdx];

  function dotColor(sample: Sample): string {
    const submittedCount = sample.sample_reveals.length;
    if (submittedCount === 0) return 'bg-[#333]';
    if (submittedCount >= participants.length) return 'bg-green-500';
    return 'bg-amber-400';
  }

  return (
    <>
      <div className="bg-cream rounded-xl overflow-hidden" style={{ border: '0.5px solid #E5DDD0' }}>
        <div className="px-5 pt-4 pb-0">
          <p className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-3">
            Submission tracker
          </p>
          <div className="flex gap-1 overflow-x-auto pb-3">
            {samples.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveSampleIdx(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  i === activeSampleIdx
                    ? 'bg-amber text-black'
                    : 'bg-[#EDE7D5] text-[#666] hover:bg-[#E5DDD0]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${i === activeSampleIdx ? 'bg-black/40' : dotColor(s)}`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[#E5DDD0]">
          {participants.length === 0 ? (
            <p className="px-5 py-4 text-sm text-[#999]">No participants yet.</p>
          ) : (
            participants.map(p => {
              const revealed = activeSample?.sample_reveals.find(r => r.user_id === p.user_id);
              return (
                <button
                  key={p.user_id}
                  onClick={() => revealed && setSelected({ participant: p, sample: activeSample })}
                  className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${
                    revealed ? 'hover:bg-[#EDE7D5] cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#E5DDD0] flex items-center justify-center text-xs font-bold text-[#0D0D0D] shrink-0">
                      {p.profile?.discord_username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0D0D0D]">{p.profile?.discord_username}</p>
                      <p className="text-xs text-[#999]">
                        {revealed
                          ? `Submitted ${new Date(revealed.revealed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : 'Not submitted'}
                      </p>
                    </div>
                  </div>
                  {revealed ? (
                    <span className="text-green-500 text-base">✓</span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#333]" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {selected && (
        <GuessModal
          participant={selected.participant}
          sample={selected.sample}
          answers={allAnswers}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
