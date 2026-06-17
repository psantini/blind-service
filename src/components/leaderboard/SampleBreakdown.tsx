'use client';

import { Fragment, useState } from 'react';

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
}

interface AnswerCell {
  value: string | null;
  points: number | null;
  fuzzyPending: boolean;
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
}

function cellColor(cell: AnswerCell | undefined, correctValue: string): string {
  if (!cell || cell.value === null) return 'text-[#999]';
  if (cell.fuzzyPending) return 'text-amber';
  const norm = (s: string) => s.trim().toLowerCase();
  if (norm(cell.value) === norm(correctValue)) return 'text-green-600';
  if ((cell.points ?? 0) > 0) return 'text-amber';
  return 'text-[#999] line-through';
}

function SampleCard({ sample, players, answerMap, nosingEnabled }: {
  sample: SampleSection;
  players: Player[];
  answerMap: Record<string, Record<string, AnswerCell>>;
  nosingEnabled: boolean;
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
                  <th key={p.id} className="px-4 py-2 text-left text-xs font-medium text-[#999] w-32">
                    {p.discord_username}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD0]">
              {orderedAttrs.map((attr, i) => {
                const isFirstTaste = showRoundLabels && attr.round === 'taste' && (i === 0 || orderedAttrs[i - 1]?.round === 'nose');
                const isFirstNose = showRoundLabels && attr.round === 'nose' && i === 0;

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
                        const pts = cell?.fuzzyPending
                          ? '?pt'
                          : cell?.points !== null && cell?.points !== undefined
                          ? `${cell.points}pt`
                          : null;
                        return (
                          <td key={p.id} className="px-4 py-2.5">
                            <span className={`text-xs ${color}`}>
                              {cell?.value ?? <span className="text-[#ccc]">—</span>}
                            </span>
                            {pts !== null && (
                              <span className="text-[10px] text-[#999] ml-1">({pts})</span>
                            )}
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

export function SampleBreakdown({ samples, players, answerMap, nosingEnabled }: SampleBreakdownProps) {
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
        />
      ))}
    </div>
  );
}
