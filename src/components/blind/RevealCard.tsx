'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScoreBreakdown } from '@/components/scoring/ScoreBreakdown';

interface Attribute {
  id: string;
  name: string;
  value: string;
  input_type: string;
  scoring_type: string;
}

interface QuestionWithAttr {
  id: string;
  round: string;
  attribute: { id: string; name: string; input_type: string; scoring_type: string } | null;
}

interface Answer {
  id: string;
  value: string | null;
  points_earned: number | null;
  fuzzy_flagged: boolean;
  host_approved: boolean | null;
  user_id: string;
  question_id: string;
  profile: { id: string; discord_username: string; discord_avatar_url: string | null } | null;
}

interface RevealCardProps {
  blindId: string;
  sample: { id: string; label: string; bottle_image_url: string | null };
  attributes: Attribute[];
  questions: QuestionWithAttr[];
  allAnswers: Answer[];
  currentUserId: string;
  nextSample: { id: string; label: string } | null;
}

function pointDisplay(answer: Answer | undefined): { text: string; color: string } {
  if (!answer) return { text: '—', color: 'text-muted' };
  if (answer.fuzzy_flagged && answer.host_approved === null) return { text: '? pts', color: 'text-amber' };
  if (answer.points_earned === null) return { text: '—', color: 'text-muted' };
  if (answer.points_earned === 0) return { text: '0 pts', color: 'text-muted' };
  return { text: `${answer.points_earned} pts`, color: 'text-green-400 font-semibold' };
}

function answerColor(answer: Answer | undefined, correctValue: string): string {
  if (!answer || answer.value === null) return 'text-muted';
  if (answer.fuzzy_flagged && answer.host_approved === null) return 'text-amber';
  const normalized = (s: string) => s.trim().toLowerCase();
  if (normalized(answer.value) === normalized(correctValue)) return 'text-green-400';
  if ((answer.points_earned ?? 0) > 0) return 'text-amber';
  return 'text-muted line-through';
}

export function RevealCard({
  blindId,
  sample,
  attributes,
  questions,
  allAnswers,
  currentUserId,
  nextSample,
}: RevealCardProps) {
  const [othersExpanded, setOthersExpanded] = useState(true);

  const myAnswers = allAnswers.filter(a => a.user_id === currentUserId);
  const myTotal = myAnswers.reduce((sum, a) => sum + (a.points_earned ?? 0), 0);
  const pendingCount = myAnswers.filter(a => a.fuzzy_flagged && a.host_approved === null).length;

  // Group answers by user (excluding self)
  const otherUsers = [...new Set(
    allAnswers.filter(a => a.user_id !== currentUserId).map(a => a.user_id)
  )];

  // Build attribute map
  const attrMap = Object.fromEntries(attributes.map(a => [a.id, a]));
  const questionAttrMap = Object.fromEntries(
    questions.map(q => [q.id, q.attribute ? attrMap[q.attribute.id] ?? null : null])
  );

  const noseQuestions = questions.filter(q => q.round === 'nose');
  const tasteQuestions = questions.filter(q => q.round === 'taste');
  const hasNoseRound = noseQuestions.length > 0;

  function renderAnswerRow(q: QuestionWithAttr, userAnswers: Answer[], isMyRow: boolean) {
    const attr = questionAttrMap[q.id];
    if (!attr) return null;
    const correctAttr = attributes.find(a => a.id === attr.id);
    const answer = userAnswers.find(a => a.question_id === q.id);
    const { text: pts, color: ptsColor } = pointDisplay(answer);
    const ansColor = answer && correctAttr ? answerColor(answer, correctAttr.value) : 'text-muted';
    const attrLabel = attr.name === 'finish_type' ? 'Finish type' : attr.name;

    if (isMyRow) {
      return (
        <div key={q.id} className="grid grid-cols-4 px-5 py-2.5 text-sm items-center">
          <span className="text-[#666] capitalize">{attrLabel}</span>
          <span className="text-[#0D0D0D] font-medium">{correctAttr?.value ?? '—'}</span>
          <span className={ansColor}>{answer?.value || '—'}</span>
          <span className={`text-right text-xs ${ptsColor}`}>{pts}</span>
        </div>
      );
    }
    return (
      <span key={q.id} className={`text-xs px-2 py-1 bg-[#EDE7D5] rounded ${ansColor}`}>
        {attr.name === 'finish_type' ? 'Finish' : attr.name}: {answer?.value ?? '—'} ({pts})
      </span>
    );
  }

  function renderRoundHeader(label: string) {
    return (
      <div className="px-5 py-1.5 bg-[#EDE7D5]" style={{ borderBottom: '0.5px solid #E5DDD0' }}>
        <p className="text-[10px] font-semibold text-[#888] uppercase tracking-widest">{label}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Header */}
      <div>
        <p className="text-xs text-muted uppercase tracking-wide">Sample {sample.label} — Revealed</p>
        <h2 className="text-2xl font-display italic font-bold text-[#0D0D0D] mt-1">
          {attributes.find(a => a.name === 'distillery')?.value ?? 'Unknown'}
        </h2>
      </div>

      {/* Hero: image + score */}
      <div className="bg-cream rounded-xl overflow-hidden" style={{ border: '0.5px solid #E5DDD0' }}>
        <div className="flex gap-0">
          {sample.bottle_image_url && (
            <div className="w-40 shrink-0 bg-[#EDE7D5] flex items-center justify-center p-3" style={{ borderRight: '0.5px solid #E5DDD0' }}>
              <img
                src={sample.bottle_image_url}
                alt="Bottle"
                className="max-h-48 object-contain"
              />
            </div>
          )}
          <div className="flex-1 p-5">
            <p className="text-4xl font-bold text-[#0D0D0D]">{myTotal}</p>
            <p className="text-sm text-[#666] mb-2">pts scored this sample</p>
            {pendingCount > 0 && (
              <Badge variant="amber" className="mb-3">
                +? pts pending host review
              </Badge>
            )}
            <hr className="border-[#E5DDD0] my-3" />
            <div className="grid grid-cols-2 gap-3 text-sm">
              {attributes.map(attr => (
                <div key={attr.id}>
                  <p className="text-xs text-[#999] capitalize">{attr.name === 'finish_type' ? 'Finish type' : attr.name}</p>
                  <p className="font-medium text-[#0D0D0D]">{attr.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Your answers table */}
      <div className="bg-cream rounded-xl overflow-hidden" style={{ border: '0.5px solid #E5DDD0' }}>
        <div className="px-5 py-3" style={{ borderBottom: '0.5px solid #E5DDD0' }}>
          <p className="text-xs font-semibold text-[#666] uppercase tracking-wider">Your answers</p>
        </div>
        <div className="divide-y divide-[#E5DDD0]">
          <div className="grid grid-cols-4 px-5 py-2 text-xs text-[#999] font-medium">
            <span>Attribute</span>
            <span>Correct</span>
            <span>You said</span>
            <span className="text-right">Pts</span>
          </div>
          {hasNoseRound ? (
            <>
              {renderRoundHeader('Nosing')}
              {noseQuestions.map(q => renderAnswerRow(q, myAnswers, true))}
              {tasteQuestions.length > 0 && (
                <>
                  {renderRoundHeader('Tasting')}
                  {tasteQuestions.map(q => renderAnswerRow(q, myAnswers, true))}
                </>
              )}
            </>
          ) : (
            questions.map(q => renderAnswerRow(q, myAnswers, true))
          )}
        </div>
      </div>

      {/* Other participants */}
      {otherUsers.length > 0 && (
        <div className="bg-cream rounded-xl overflow-hidden" style={{ border: '0.5px solid #E5DDD0' }}>
          <button
            onClick={() => setOthersExpanded(e => !e)}
            className="w-full flex items-center justify-between px-5 py-3 text-left"
            style={{ borderBottom: '0.5px solid #E5DDD0' }}
          >
            <div>
              <p className="text-xs font-semibold text-[#666] uppercase tracking-wider">Other participants</p>
              <p className="text-xs text-[#999]">{otherUsers.length} revealed so far</p>
            </div>
            <span className="text-[#999] text-sm">{othersExpanded ? '▲' : '▼'}</span>
          </button>
          {othersExpanded && (
            <div className="divide-y divide-[#E5DDD0]">
              {otherUsers.map(userId => {
                const userAnswers = allAnswers.filter(a => a.user_id === userId);
                const userProfile = userAnswers[0]?.profile;
                const userTotal = userAnswers.reduce((sum, a) => sum + (a.points_earned ?? 0), 0);
                const userPending = userAnswers.filter(a => a.fuzzy_flagged && a.host_approved === null).length;

                return (
                  <div key={userId} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#0D0D0D]">
                        {userProfile?.discord_username ?? 'Unknown'}
                      </span>
                      <span className="text-sm font-semibold text-[#0D0D0D]">
                        {userTotal} pts{userPending > 0 && <span className="text-amber ml-1">+?</span>}
                      </span>
                    </div>
                    {hasNoseRound ? (
                      <div className="space-y-2">
                        {noseQuestions.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-[#888] uppercase tracking-widest mb-1">Nosing</p>
                            <div className="flex flex-wrap gap-1.5">
                              {noseQuestions.map(q => renderAnswerRow(q, userAnswers, false))}
                            </div>
                          </div>
                        )}
                        {tasteQuestions.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-[#888] uppercase tracking-widest mb-1">Tasting</p>
                            <div className="flex flex-wrap gap-1.5">
                              {tasteQuestions.map(q => renderAnswerRow(q, userAnswers, false))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {questions.map(q => renderAnswerRow(q, userAnswers, false))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Next button */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted">
          {otherUsers.length > 0 ? `${otherUsers.length} other${otherUsers.length !== 1 ? 's' : ''} revealed` : ''}
        </span>
        {nextSample ? (
          <Link href={`/blinds/${blindId}/taste/${nextSample.id}`}>
            <Button>Continue to Sample {nextSample.label} →</Button>
          </Link>
        ) : (
          <Link href={`/blinds/${blindId}/leaderboard`}>
            <Button>View leaderboard →</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
