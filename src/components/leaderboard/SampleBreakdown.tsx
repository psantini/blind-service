'use client';

import { Fragment, useState, useTransition } from 'react';

interface Player {
  id: string;
  discord_username: string;
}

interface AttributeRow {
  questionId: string;
  attrId: string;
  name: string;
  correctValue: string;
  round: 'nose' | 'taste';
  scoringType: 'exact' | 'bracket' | 'none';
}

interface AnswerCell {
  answerId: string;
  value: string | null;
  points: number | null;
  fuzzyPending: boolean;
  hostApproved: boolean | null;
}

interface SampleSection {
  id: string;
  label: string;
  attributes: AttributeRow[];
}

interface SampleBreakdownProps {
  samples: SampleSection[];
  players: Player[];
  // answerMap[userId][questionId]
  answerMap: Record<string, Record<string, AnswerCell>>;
  nosingEnabled: boolean;
  // Only provided on the host dashboard — enables override controls
  onOverride?: (answerId: string, approved: boolean) => Promise<void>;
}

function cellColor(cell: AnswerCell | undefined, correctValue: string): string {
  if (!cell || cell.value === null) return 'text-[#999]';
  if (cell.fuzzyPending) return 'text-amber';
  const norm = (s: string) => s.trim().toLowerCase();
  if (norm(cell.value) === norm(correctValue)) return 'text-green-600';
  if ((cell.points ?? 0) > 0) return 'text-amber';
  return 'text-[#999] line-through';
}

function OverrideButton({ cell, onOverride }: {
  cell: AnswerCell;
  onOverride: (answerId: string, approved: boolean) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const isOverridden = cell.hostApproved === true && !cell.fuzzyPending;

  return (
    <button
      onClick={() => startTransition(() => onOverride(cell.answerId, !isOverridden))}
      disabled={isPending || cell.fuzzyPending}
      title={isOverridden ? 'Revoke override' : 'Override — mark as correct'}
      className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded border transition-colors disabled:opacity-40 ${
        isOverridden
          ? 'border-green-400 text-green-600 hover:border-red-300 hover:text-red-500'
          : 'border-[#E5DDD0] text-[#999] hover:border-amber hover:text-amber'
      }`}
    >
      {isOverridden ? '✓ override' : 'override'}
    </button>
  );
}

function SampleCard({ sample, players, answerMap, nosingEnabled, onOverride }: {
  sample: SampleSection;
  players: Player[];
  answerMap: Record<string, Record<string, AnswerCell>>;
  nosingEnabled: boolean;
  onOverride?: (answerId: string, approved: boolean) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  const noseAttrs = sample.attributes.filter(a => a.round === 'nose');
  const tasteAttrs = sample.attributes.filter(a => a.round === 'taste');
  const showRoundLabels = nosingEnabled && noseAttrs.length > 0;
  const orderedAttrs = showRoundLabels ? [...noseAttrs, ...tasteAttrs] : sample.attributes;

  return (
    <div className="bg-cream rounded-xl overflow-hidden" style={{ border: '0.5px solid #E5DDD0' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-left"
        style={{ borderBottom: open ? '0.5px solid #E5DDD0' : undefined }}
      >
        <p className="text-sm font-semibold text-[#0D0D0D]">Sample {sample.label}</p>
        <span className="text-[#999] text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-max">
            <thead>
              <tr style={{ borderBottom: '0.5px solid #E5DDD0' }}>
                <th className="px-5 py-2 text-left text-xs font-medium text-[#999] w-28">Attribute</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[#999] w-28">Correct</th>
                {players.map(p => (
                  <th key={p.id} className="px-4 py-2 text-left text-xs font-medium text-[#999] w-36">
                    {p.discord_username}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD0]">
              {orderedAttrs.map((attr, i) => {
                const isFirstTaste = showRoundLabels && attr.round === 'taste' && (i === 0 || orderedAttrs[i - 1]?.round === 'nose');
                const isFirstNose = showRoundLabels && attr.round === 'nose' && i === 0;
                const canOverride = onOverride && attr.scoringType === 'exact';

                return (
                  <Fragment key={attr.questionId}>
                    {isFirstNose && (
                      <tr className="bg-[#EDE7D5]">
                        <td colSpan={2 + players.length} className="px-5 py-1 text-[10px] font-semibold text-[#888] uppercase tracking-widest">
                          Nosing
                        </td>
                      </tr>
                    )}
                    {isFirstTaste && (
                      <tr className="bg-[#EDE7D5]">
                        <td colSpan={2 + players.length} className="px-5 py-1 text-[10px] font-semibold text-[#888] uppercase tracking-widest">
                          Tasting
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="px-5 py-2.5 text-xs text-[#666] capitalize">{attr.name}</td>
                      <td className="px-4 py-2.5 text-xs font-medium text-[#0D0D0D]">{attr.correctValue}</td>
                      {players.map(p => {
                        const cell = answerMap[p.id]?.[attr.questionId];
                        const color = cellColor(cell, attr.correctValue);
                        const pts = attr.scoringType === 'none'
                          ? null
                          : cell?.fuzzyPending
                          ? '?pt'
                          : cell?.points !== null && cell?.points !== undefined
                          ? `${cell.points}pt`
                          : null;

                        // Show override button only for exact-match attrs where player has an answer
                        // and it wasn't an exact match (wouldn't make sense to override a correct answer)
                        const showOverride = canOverride && cell && cell.value !== null && !cell.fuzzyPending;
                        const norm = (s: string) => s.trim().toLowerCase();
                        const isAlreadyExact = cell?.value !== null && norm(cell?.value ?? '') === norm(attr.correctValue);

                        return (
                          <td key={p.id} className="px-4 py-2.5">
                            <div className="flex items-center flex-wrap gap-x-1">
                              <span className={`text-xs ${color}`}>
                                {cell?.value ?? <span className="text-[#ccc]">—</span>}
                              </span>
                              {pts !== null && (
                                <span className="text-[10px] text-[#999]">({pts})</span>
                              )}
                              {showOverride && !isAlreadyExact && (
                                <OverrideButton cell={cell} onOverride={onOverride!} />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function SampleBreakdown({ samples, players, answerMap, nosingEnabled, onOverride }: SampleBreakdownProps) {
  if (samples.length === 0 || players.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-[#666] uppercase tracking-wider">Sample breakdown</p>
      {samples.map(sample => (
        <SampleCard
          key={sample.id}
          sample={sample}
          players={players}
          answerMap={answerMap}
          nosingEnabled={nosingEnabled}
          onOverride={onOverride}
        />
      ))}
    </div>
  );
}
