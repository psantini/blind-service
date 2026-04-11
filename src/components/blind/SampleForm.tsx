'use client';

import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { WHISKEY_TYPES } from '@/lib/constants/whiskeyTypes';
import { DEFAULT_AGE_BRACKETS, DEFAULT_PROOF_BRACKETS } from '@/lib/constants/defaultBrackets';
import { SampleData, AttributeData } from './SampleSetupForm';

interface SampleFormProps {
  sample: SampleData;
  nosingEnabled: boolean;
  onChange: (data: Partial<SampleData>) => void;
  onSave: () => void;
  onDelete?: () => void;
  isSaving: boolean;
}

// Attributes whose scoring TYPE is locked (can't switch exact ↔ bracket)
const FIXED_SCORING_TYPE = ['distillery', 'type', 'finished', 'finish_type'];

function BracketEditor({
  brackets,
  onChange,
}: {
  brackets: Array<{ max_delta: number; points: number }>;
  onChange: (b: Array<{ max_delta: number; points: number }>) => void;
}) {
  function update(idx: number, field: 'max_delta' | 'points', val: string) {
    const next = brackets.map((b, i) =>
      i === idx ? { ...b, [field]: Number(val) } : b
    );
    onChange(next);
  }

  function addTier() {
    onChange([...brackets, { max_delta: 0, points: 0 }]);
  }

  function removeTier(idx: number) {
    onChange(brackets.filter((_, i) => i !== idx));
  }

  return (
    <div className="mt-2 ml-1 border-l-2 border-stone-100 pl-3 space-y-1.5">
      <p className="text-xs text-stone-400 mb-1">Bracket tiers (sorted by proximity)</p>
      {brackets.map((tier, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-xs text-stone-400 w-16 shrink-0">within</span>
          <Input
            type="number"
            value={tier.max_delta}
            onChange={e => update(idx, 'max_delta', e.target.value)}
            className="w-16 text-xs py-1"
            min="0"
            step="0.5"
          />
          <span className="text-xs text-stone-400">→</span>
          <Input
            type="number"
            value={tier.points}
            onChange={e => update(idx, 'points', e.target.value)}
            className="w-14 text-xs py-1"
            min="0"
          />
          <span className="text-xs text-stone-400">pts</span>
          <button
            type="button"
            onClick={() => removeTier(idx)}
            className="text-stone-300 hover:text-red-400 text-sm ml-auto"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addTier}
        className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
      >
        + Add tier
      </button>
    </div>
  );
}

export function SampleForm({ sample, nosingEnabled, onChange, onSave, onDelete, isSaving }: SampleFormProps) {
  function updateAttr(index: number, updates: Partial<AttributeData>) {
    const next = sample.attributes.map((a, i) => i === index ? { ...a, ...updates } : a);

    // Handle finished → finish_type conditional
    const finishedIdx = next.findIndex(a => a.name === 'finished');
    if (finishedIdx !== -1) {
      const isFinished = updates.value === 'yes' || (next[finishedIdx].value === 'yes');
      const hasFinishType = next.some(a => a.name === 'finish_type');

      if (isFinished && !hasFinishType) {
        next.splice(finishedIdx + 1, 0, {
          name: 'finish_type',
          value: '',
          inputType: 'text',
          scoringType: 'exact',
          brackets: null,
          rounds: next[finishedIdx].rounds,
        });
      } else if (!isFinished && hasFinishType) {
        const ftIdx = next.findIndex(a => a.name === 'finish_type');
        next.splice(ftIdx, 1);
      }
    }

    onChange({ attributes: next });
  }

  function setScoringType(index: number, scoringType: 'exact' | 'bracket') {
    const attr = sample.attributes[index];
    const brackets =
      scoringType === 'bracket'
        ? (attr.brackets && attr.brackets.length > 1 ? attr.brackets : [{ max_delta: 0, points: 3 }])
        : [{ max_delta: 0, points: attr.brackets?.[0]?.points ?? 3 }]; // preserve exact pts
    updateAttr(index, { scoringType, brackets, inputType: scoringType === 'bracket' ? 'numeric' : attr.inputType });
  }

  function setExactPoints(index: number, pts: number) {
    updateAttr(index, { brackets: [{ max_delta: 0, points: pts }] });
  }

  function toggleRound(attrIdx: number, round: 'nose' | 'taste') {
    const attr = sample.attributes[attrIdx];
    const rounds = attr.rounds.includes(round)
      ? attr.rounds.filter(r => r !== round)
      : [...attr.rounds, round];
    updateAttr(attrIdx, { rounds });
  }

  function removeAttr(index: number) {
    onChange({ attributes: sample.attributes.filter((_, i) => i !== index) });
  }

  function addCustomAttr() {
    onChange({
      attributes: [
        ...sample.attributes,
        {
          name: '',
          value: '',
          inputType: 'text',
          scoringType: 'exact',
          brackets: null,
          rounds: ['taste'],
        },
      ],
    });
  }

  return (
    <div className="space-y-4">
      {/* Bottle image */}
      <div>
        <label className="text-xs font-medium text-stone-500 block mb-1">Bottle image (optional)</label>
        <input
          type="file"
          accept="image/*"
          className="text-sm text-stone-600"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            onChange({ bottleImageUrl: url });
          }}
        />
        {sample.bottleImageUrl && (
          <img
            src={sample.bottleImageUrl}
            alt="Bottle"
            className="mt-2 h-20 w-auto rounded object-contain border border-stone-200"
          />
        )}
      </div>

      {/* Attribute rows */}
      <div className="space-y-3">
        {sample.attributes.map((attr, attrIdx) => {
          const isFinishType = attr.name === 'finish_type';
          const isStandard = ['distillery', 'type', 'age', 'proof', 'finished', 'finish_type'].includes(attr.name);
          const fixedScoringType = FIXED_SCORING_TYPE.includes(attr.name);
          const maxPts = attr.scoringType === 'bracket'
            ? Math.max(0, ...((attr.brackets ?? []).map(b => b.points)))
            : (attr.brackets?.[0]?.points ?? 3);

          return (
            <div
              key={attrIdx}
              className={`${isFinishType ? 'ml-4 bg-stone-50 border border-stone-200 rounded-lg p-3' : 'border border-stone-100 rounded-lg p-3'}`}
            >
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-start">
                {/* Name + value input */}
                <div>
                  {!isStandard && (
                    <Input
                      value={attr.name}
                      onChange={(e) => updateAttr(attrIdx, { name: e.target.value })}
                      placeholder="Attribute name"
                      className="mb-1.5 text-xs"
                    />
                  )}
                  <label className="text-xs font-medium text-stone-600 block mb-1 capitalize">
                    {isStandard ? (attr.name === 'finish_type' ? 'Finish type' : attr.name) : 'Value'}
                  </label>

                  {attr.name === 'finished' ? (
                    <div className="flex gap-2">
                      {['no', 'yes'].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => updateAttr(attrIdx, { value: v })}
                          className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors border ${
                            attr.value === v
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500'
                          }`}
                        >
                          {v === 'yes' ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  ) : attr.inputType === 'dropdown' ? (
                    <Dropdown
                      value={attr.value}
                      options={WHISKEY_TYPES.map(t => ({ value: t, label: t }))}
                      onChange={(e) => updateAttr(attrIdx, { value: e.target.value })}
                    />
                  ) : (
                    <Input
                      type={attr.inputType === 'numeric' ? 'number' : 'text'}
                      value={attr.value}
                      onChange={(e) => updateAttr(attrIdx, { value: e.target.value })}
                      placeholder={attr.inputType === 'numeric' ? '0' : 'Enter value'}
                    />
                  )}

                  {/* Scoring controls */}
                  <div className="flex gap-1.5 mt-2 flex-wrap items-center">
                    {/* Scoring type toggle — only for non-fixed-type attrs */}
                    {!fixedScoringType && (['exact', 'bracket'] as const).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setScoringType(attrIdx, st)}
                        className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                          attr.scoringType === st
                            ? 'bg-stone-800 text-white border-stone-800'
                            : 'bg-white text-stone-400 border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {st === 'exact' ? 'Exact' : `Bracket · ${maxPts} pts`}
                      </button>
                    ))}

                    {/* Fuzzy badge for applicable attrs */}
                    {(attr.name === 'distillery' || attr.name === 'finish_type') && (
                      <Badge variant="amber">fuzzy</Badge>
                    )}

                    {/* Editable pts for all exact-match attrs */}
                    {attr.scoringType === 'exact' && (
                      <div className="flex items-center gap-1">
                        {fixedScoringType && (
                          <span className="text-xs text-stone-400">exact ·</span>
                        )}
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={attr.brackets?.[0]?.points ?? 3}
                          onChange={e => setExactPoints(attrIdx, Number(e.target.value))}
                          className="w-10 text-xs border border-stone-200 rounded px-1.5 py-0.5 text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-400"
                        />
                        <span className="text-xs text-stone-400">pts</span>
                      </div>
                    )}
                  </div>

                  {/* Bracket editor */}
                  {attr.scoringType === 'bracket' && attr.brackets && (
                    <BracketEditor
                      brackets={attr.brackets}
                      onChange={b => updateAttr(attrIdx, { brackets: b })}
                    />
                  )}
                </div>

                {/* Empty spacer (badge area no longer needed) */}
                <div />

                {/* Round pills */}
                <div className="flex flex-col gap-1 pt-5">
                  {nosingEnabled && (
                    <button
                      type="button"
                      onClick={() => toggleRound(attrIdx, 'nose')}
                      className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                        attr.rounds.includes('nose')
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-400 border-stone-200'
                      }`}
                    >
                      Nose
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleRound(attrIdx, 'taste')}
                    className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                      attr.rounds.includes('taste')
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-400 border-stone-200'
                    }`}
                  >
                    Taste
                  </button>
                </div>

                {/* Remove */}
                {!isStandard ? (
                  <button
                    type="button"
                    onClick={() => removeAttr(attrIdx)}
                    className="text-stone-300 hover:text-red-400 transition-colors text-sm px-1 pt-5"
                  >
                    ×
                  </button>
                ) : (
                  <div className="w-5" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addCustomAttr}
        className="text-xs text-stone-500 hover:text-stone-800 transition-colors"
      >
        + Add custom attribute
      </button>

      <div className="flex justify-between pt-2 border-t border-stone-100">
        {onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:bg-red-50">
            Remove sample
          </Button>
        )}
        <div className="ml-auto">
          <Button size="sm" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save sample'}
          </Button>
        </div>
      </div>
    </div>
  );
}
