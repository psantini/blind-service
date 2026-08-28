'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DEFAULT_AGE_BRACKETS, DEFAULT_PROOF_BRACKETS } from '@/lib/constants/defaultBrackets';
import { createAdventCalendar } from '@/app/advent/new/actions';

interface GroupMember {
  id: string;
  discord_username: string;
}

interface Group {
  id: string;
  name: string;
  members: GroupMember[];
}

interface ManifestRow {
  userId: string;
  bottlesExpected: number;
}

interface AdventAttributeTemplate {
  name: string;
  inputType: 'text' | 'dropdown' | 'numeric' | 'boolean';
  scoringType: 'exact' | 'bracket';
  brackets: Array<{ max_delta: number; points: number }> | null;
}

const FIXED_SCORING_TYPE = ['distillery', 'type', 'finished', 'finish_type'];

function buildDefaultTemplates(): AdventAttributeTemplate[] {
  return [
    { name: 'distillery', inputType: 'text',     scoringType: 'exact',   brackets: null },
    { name: 'type',       inputType: 'dropdown',  scoringType: 'exact',   brackets: null },
    { name: 'age',        inputType: 'numeric',   scoringType: 'bracket', brackets: DEFAULT_AGE_BRACKETS },
    { name: 'proof',      inputType: 'numeric',   scoringType: 'bracket', brackets: DEFAULT_PROOF_BRACKETS },
    { name: 'finished',   inputType: 'boolean',   scoringType: 'exact',   brackets: null },
  ];
}

function BracketEditor({
  brackets,
  onChange,
}: {
  brackets: Array<{ max_delta: number; points: number }>;
  onChange: (b: Array<{ max_delta: number; points: number }>) => void;
}) {
  function update(idx: number, field: 'max_delta' | 'points', val: string) {
    onChange(brackets.map((b, i) => i === idx ? { ...b, [field]: Number(val) } : b));
  }

  return (
    <div className="mt-2 ml-1 border-l-2 border-[#333] pl-3 space-y-1.5">
      <p className="text-xs text-[#999] mb-1">Bracket tiers</p>
      {brackets.map((tier, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-xs text-[#999] w-16 shrink-0">within</span>
          <Input type="number" value={tier.max_delta} onChange={e => update(idx, 'max_delta', e.target.value)} className="w-16 text-xs py-1" min="0" step="0.5" />
          <span className="text-xs text-[#999]">→</span>
          <Input type="number" value={tier.points} onChange={e => update(idx, 'points', e.target.value)} className="w-14 text-xs py-1" min="0" />
          <span className="text-xs text-[#999]">pts</span>
          <button type="button" onClick={() => onChange(brackets.filter((_, i) => i !== idx))} className="text-[#666] hover:text-red-400 text-sm ml-auto">×</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...brackets, { max_delta: 0, points: 0 }])} className="text-xs text-[#999] hover:text-[#0D0D0D] transition-colors">
        + Add tier
      </button>
    </div>
  );
}

export function AdventSetupForm({ groups }: { groups: Group[] }) {
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const [manifest, setManifest] = useState<ManifestRow[]>([{ userId: '', bottlesExpected: 3 }]);
  const [templates, setTemplates] = useState<AdventAttributeTemplate[]>(buildDefaultTemplates);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentGroup = groups.find(g => g.id === groupId);
  const selectedUserIds = new Set(manifest.map(r => r.userId).filter(Boolean));
  const total = manifest.reduce((sum, r) => sum + r.bottlesExpected, 0);
  const canSubmit = !!name.trim() && !!groupId && total === 24 && manifest.every(r => r.userId) && !isPending;
  const disabledReason = !name.trim()
    ? 'Enter a calendar name'
    : !groupId
    ? 'Select a group'
    : !manifest.every(r => r.userId)
    ? 'All contributors must be selected'
    : total !== 24
    ? `Bottle total must equal 24 (currently ${total})`
    : null;

  // ── Manifest handlers ──────────────────────────────────────────────────────

  function addManifestRow() {
    setManifest(prev => [...prev, { userId: '', bottlesExpected: 3 }]);
  }

  function removeManifestRow(i: number) {
    setManifest(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateManifestRow(i: number, updates: Partial<ManifestRow>) {
    setManifest(prev => prev.map((r, idx) => idx === i ? { ...r, ...updates } : r));
  }

  // ── Template handlers ──────────────────────────────────────────────────────

  function updateTemplate(i: number, updates: Partial<AdventAttributeTemplate>) {
    setTemplates(prev => prev.map((t, idx) => idx === i ? { ...t, ...updates } : t));
  }

  function setScoringType(i: number, scoringType: 'exact' | 'bracket') {
    const t = templates[i];
    const brackets = scoringType === 'bracket'
      ? (t.brackets && t.brackets.length > 1 ? t.brackets : [{ max_delta: 0, points: 3 }])
      : [{ max_delta: 0, points: t.brackets?.[0]?.points ?? 3 }];
    updateTemplate(i, { scoringType, brackets, inputType: scoringType === 'bracket' ? 'numeric' : t.inputType });
  }

  function setExactPoints(i: number, pts: number) {
    updateTemplate(i, { brackets: [{ max_delta: 0, points: pts }] });
  }

  function removeTemplate(i: number) {
    setTemplates(prev => prev.filter((_, idx) => idx !== i));
  }

  function addCustomTemplate() {
    setTemplates(prev => [...prev, { name: '', inputType: 'text', scoringType: 'exact', brackets: null }]);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await createAdventCalendar({ name: name.trim(), groupId, manifest, questionTemplates: templates });
        if (result?.redirectTo) window.location.href = result.redirectTo;
      } catch (err: any) {
        setError(err?.message ?? 'Something went wrong');
      }
    });
  }

  const selectClass = 'w-full rounded-lg border border-[#E5DDD0] bg-[#EDE7D5] text-[#0D0D0D] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber';

  return (
    <div className="space-y-6">

      {/* ── Section 1: Name ── */}
      <div className="bg-cream rounded-xl p-6 space-y-4" style={{ border: '0.5px solid #E5DDD0' }}>
        <p className="text-xs font-semibold text-[#666] uppercase tracking-wider">Calendar</p>

        <div>
          <label className="block text-sm font-medium text-[#0D0D0D] mb-1.5">Calendar name</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Advent 2025" autoFocus />
        </div>

        {groups.length === 1 ? (
          <input type="hidden" value={groups[0]!.id} />
        ) : groups.length > 1 ? (
          <div>
            <label className="block text-sm font-medium text-[#0D0D0D] mb-1.5">Group</label>
            <select value={groupId} onChange={e => { setGroupId(e.target.value); setManifest([{ userId: '', bottlesExpected: 3 }]); }} className={selectClass}>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        ) : null}
      </div>

      {/* ── Section 2: Contributor manifest ── */}
      <div className="bg-cream rounded-xl p-6 space-y-4" style={{ border: '0.5px solid #E5DDD0' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[#666] uppercase tracking-wider">Contributors</p>
          <span className={`text-sm font-semibold ${total === 24 ? 'text-green-600' : 'text-amber'}`}>
            {total} / 24 bottles
          </span>
        </div>

        <div className="space-y-2">
          {manifest.map((row, i) => {
            const availableMembers = (currentGroup?.members ?? []).filter(
              m => !selectedUserIds.has(m.id) || m.id === row.userId
            );
            return (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={row.userId}
                  onChange={e => updateManifestRow(i, { userId: e.target.value })}
                  className={`${selectClass} flex-1`}
                >
                  <option value="">Select contributor…</option>
                  {availableMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.discord_username}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    value={row.bottlesExpected}
                    onChange={e => updateManifestRow(i, { bottlesExpected: Math.max(1, Number(e.target.value)) })}
                    className="w-16 text-sm text-center"
                  />
                  <span className="text-xs text-[#999]">bottles</span>
                </div>
                {manifest.length > 1 && (
                  <button type="button" onClick={() => removeManifestRow(i)} className="text-[#666] hover:text-red-400 transition-colors text-sm px-1">
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addManifestRow}
          disabled={(currentGroup?.members.length ?? 0) <= manifest.length}
          className="text-xs text-[#666] hover:text-[#0D0D0D] transition-colors disabled:opacity-40"
        >
          + Add contributor
        </button>

        {total !== 24 && total > 0 && (
          <p className="text-xs text-amber">{total < 24 ? `${24 - total} more bottles needed` : `${total - 24} too many bottles`}</p>
        )}
      </div>

      {/* ── Section 3: Attribute questions ── */}
      <div className="bg-cream rounded-xl p-6 space-y-4" style={{ border: '0.5px solid #E5DDD0' }}>
        <div>
          <p className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-1">Attribute questions</p>
          <p className="text-xs text-[#999]">
            Contributors will answer these for each bottle they submit. Three questions are added automatically and cannot be removed:
          </p>
          <ul className="text-xs text-[#666] list-disc list-inside space-y-0.5 mt-1">
            <li><span className="font-medium">Who submitted this</span> — dropdown of all participants, 1 point for correct guess</li>
            <li><span className="font-medium">Rating</span> — numeric, 0–10</li>
            <li><span className="font-medium">Thoughts</span> — free text</li>
          </ul>
        </div>

        <div className="space-y-3">
          {templates.map((t, i) => {
            const isStandard = ['distillery', 'type', 'age', 'proof', 'finished', 'finish_type'].includes(t.name);
            const fixedScoring = FIXED_SCORING_TYPE.includes(t.name);
            const maxPts = t.scoringType === 'bracket'
              ? Math.max(0, ...((t.brackets ?? []).map(b => b.points)))
              : (t.brackets?.[0]?.points ?? 3);

            return (
              <div key={i} className="rounded-lg p-3" style={{ border: '0.5px solid #E5DDD0' }}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    {!isStandard ? (
                      <Input
                        value={t.name}
                        onChange={e => updateTemplate(i, { name: e.target.value })}
                        placeholder="Attribute name"
                        className="text-xs"
                      />
                    ) : (
                      <p className="text-sm font-medium text-[#0D0D0D] capitalize">{t.name}</p>
                    )}

                    <div className="flex gap-1.5 flex-wrap items-center">
                      {/* Input type badge */}
                      <span className="text-[10px] text-[#999] border border-[#E5DDD0] rounded px-1.5 py-0.5 bg-[#EDE7D5]">
                        {t.inputType === 'boolean' ? 'yes/no' : t.inputType}
                      </span>

                      {/* Scoring type toggle */}
                      {!fixedScoring && (['exact', 'bracket'] as const).map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setScoringType(i, st)}
                          className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                            t.scoringType === st
                              ? 'bg-amber text-black border-amber'
                              : 'bg-[#EDE7D5] text-[#999] border-[#E5DDD0] hover:border-[#C9B99A]'
                          }`}
                        >
                          {st === 'exact' ? 'Exact' : `Bracket · ${maxPts} pts`}
                        </button>
                      ))}

                      {/* Fuzzy badge */}
                      {(t.name === 'distillery' || t.name === 'finish_type') && (
                        <Badge variant="amber">fuzzy</Badge>
                      )}

                      {/* Exact pts */}
                      {t.scoringType === 'exact' && (
                        <div className="flex items-center gap-1">
                          {fixedScoring && <span className="text-xs text-[#999]">exact ·</span>}
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={t.brackets?.[0]?.points ?? 3}
                            onChange={e => setExactPoints(i, Number(e.target.value))}
                            className="w-10 text-xs border border-[#E5DDD0] bg-[#EDE7D5] rounded px-1.5 py-0.5 text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-amber"
                          />
                          <span className="text-xs text-[#999]">pts</span>
                        </div>
                      )}
                    </div>

                    {t.scoringType === 'bracket' && t.brackets && (
                      <BracketEditor brackets={t.brackets} onChange={b => updateTemplate(i, { brackets: b })} />
                    )}
                  </div>

                  {!isStandard && (
                    <button type="button" onClick={() => removeTemplate(i)} className="text-[#666] hover:text-red-400 transition-colors text-sm px-1 pt-0.5">
                      ×
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addCustomTemplate}
          className="text-xs text-[#666] hover:text-[#0D0D0D] transition-colors"
        >
          + Add custom attribute
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-end">
        <span title={disabledReason ?? undefined} className={!canSubmit ? 'cursor-not-allowed' : undefined}>
          <Button onClick={handleSubmit} disabled={!canSubmit} className={!canSubmit ? 'pointer-events-none' : undefined}>
            {isPending ? 'Creating...' : 'Create calendar →'}
          </Button>
        </span>
      </div>

    </div>
  );
}
