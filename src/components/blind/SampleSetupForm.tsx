'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { SampleForm } from './SampleForm';
import { saveSample, deleteSample, activateBlind } from '@/app/blinds/[blindId]/host/setup/actions';
import { DEFAULT_AGE_BRACKETS, DEFAULT_PROOF_BRACKETS } from '@/lib/constants/defaultBrackets';
import { WHISKEY_TYPES } from '@/lib/constants/whiskeyTypes';
import { BlindStatus } from '@/types';

export interface SampleData {
  id: string | null;
  label: string;
  displayOrder: number;
  bottleImageUrl: string | null;
  attributes: AttributeData[];
  isExpanded: boolean;
}

export interface AttributeData {
  name: string;
  value: string;
  inputType: 'text' | 'dropdown' | 'numeric' | 'boolean';
  scoringType: 'exact' | 'bracket';
  brackets: Array<{ max_delta: number; points: number }> | null;
  rounds: Array<'nose' | 'taste'>;
}

function buildDefaultAttributes(): AttributeData[] {
  return [
    { name: 'type',         value: WHISKEY_TYPES[0], inputType: 'dropdown', scoringType: 'exact',   brackets: null,                              rounds: ['taste'] },
    { name: 'proof',        value: '',               inputType: 'numeric',  scoringType: 'bracket', brackets: DEFAULT_PROOF_BRACKETS,             rounds: ['taste'] },
    { name: 'age',          value: '',               inputType: 'numeric',  scoringType: 'bracket', brackets: DEFAULT_AGE_BRACKETS,               rounds: ['taste'] },
    { name: 'finished',     value: 'no',             inputType: 'boolean',  scoringType: 'exact',   brackets: null,                              rounds: ['taste'] },
    { name: 'distillery',   value: '',               inputType: 'text',     scoringType: 'exact',   brackets: null,                              rounds: ['taste'] },
    { name: 'bottle guess', value: '',               inputType: 'text',     scoringType: 'exact',   brackets: [{ max_delta: 0, points: 5 }],     rounds: ['taste'] },
  ];
}

function sampleLabel(index: number): string {
  return String.fromCharCode(65 + index); // A, B, C...
}

function bonusSampleLabel(index: number): string {
  return `Day 25-${index + 1}`;
}

interface SampleSetupFormProps {
  blindId: string;
  nosingEnabled: boolean;
  blindStatus: BlindStatus;
  bonusMode?: boolean;
  initialSamples: Array<{
    id: string;
    label: string;
    display_order: number;
    bottle_image_url: string | null;
    attributes: Array<{
      id: string;
      name: string;
      value: string;
      input_type: string;
      scoring_type: string;
      brackets: Array<{ max_delta: number; points: number }> | null;
      questions: Array<{ id: string; round: string }>;
    }>;
  }>;
}

export function SampleSetupForm({
  blindId,
  nosingEnabled,
  blindStatus,
  bonusMode = false,
  initialSamples,
}: SampleSetupFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();

  const [samples, setSamples] = useState<SampleData[]>(() => {
    if (initialSamples.length > 0) {
      return initialSamples.map((s, i) => {
        const attrs: AttributeData[] = s.attributes.map(a => ({
          name: a.name,
          value: a.value,
          inputType: a.input_type as AttributeData['inputType'],
          scoringType: a.scoring_type as AttributeData['scoringType'],
          brackets: a.brackets,
          rounds: a.questions.length > 0 ? a.questions.map(q => q.round as 'nose' | 'taste') : ['taste'],
        }));

        // Ensure finish_type is present if finished=yes
        const finishedAttr = attrs.find(a => a.name === 'finished');
        const hasFinishType = attrs.some(a => a.name === 'finish_type');
        if (finishedAttr?.value === 'yes' && !hasFinishType) {
          const finishIdx = attrs.findIndex(a => a.name === 'finished');
          attrs.splice(finishIdx + 1, 0, {
            name: 'finish_type',
            value: '',
            inputType: 'text',
            scoringType: 'exact',
            brackets: null,
            rounds: finishedAttr.rounds,
          });
        }

        return {
          id: s.id,
          label: s.label,
          displayOrder: s.display_order,
          bottleImageUrl: s.bottle_image_url,
          attributes: attrs,
          isExpanded: i === 0,
        };
      });
    }
    if (bonusMode) return [];
    return [{
      id: null,
      label: 'A',
      displayOrder: 0,
      bottleImageUrl: null,
      attributes: buildDefaultAttributes(),
      isExpanded: true,
    }];
  });

  function addSample() {
    setSamples(prev => [
      ...prev,
      {
        id: null,
        label: bonusMode ? bonusSampleLabel(prev.length) : sampleLabel(prev.length),
        displayOrder: bonusMode ? 25 + prev.length : prev.length,
        bottleImageUrl: null,
        attributes: buildDefaultAttributes(),
        isExpanded: true,
      },
    ]);
  }

  function toggleExpand(index: number) {
    setSamples(prev => prev.map((s, i) => i === index ? { ...s, isExpanded: !s.isExpanded } : s));
  }

  function updateSample(index: number, data: Partial<SampleData>) {
    setSamples(prev => prev.map((s, i) => i === index ? { ...s, ...data } : s));
  }

  function handleSaveSample(index: number) {
    const sample = samples[index];
    startTransition(async () => {
      const id = await saveSample(blindId, sample.id, {
        label: sample.label,
        displayOrder: sample.displayOrder,
        bottleImageUrl: sample.bottleImageUrl,
        attributes: sample.attributes,
      });
      setSamples(prev => prev.map((s, i) => i === index ? { ...s, id } : s));
    });
  }

  function handleDeleteSample(index: number) {
    const sample = samples[index];
    if (sample.id) {
      startTransition(() => deleteSample(blindId, sample.id!));
    }
    setSamples(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((s, i) => ({
        ...s,
        label: bonusMode ? bonusSampleLabel(i) : sampleLabel(i),
        displayOrder: bonusMode ? 25 + i : i,
      }));
    });
  }

  function handleSaveAll() {
    setSaveError(null);
    startTransition(async () => {
      try {
        for (let i = 0; i < samples.length; i++) {
          const sample = samples[i]!;
          const id = await saveSample(blindId, sample.id, {
            label: sample.label,
            displayOrder: sample.displayOrder,
            bottleImageUrl: sample.bottleImageUrl,
            attributes: sample.attributes,
          });
          setSamples(prev => prev.map((s, j) => j === i ? { ...s, id } : s));
        }
      } catch (err: unknown) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save — please try again');
      }
    });
  }

  function handleActivate() {
    startTransition(async () => {
      const result = await activateBlind(blindId);
      if (result?.redirectTo) {
        router.push(result.redirectTo);
      }
    });
  }

  return (
    <div>
      <div className="space-y-3 mb-6">
        {samples.map((sample, index) => (
          <div key={index} className="bg-cream rounded-xl overflow-hidden" style={{ border: '0.5px solid #E5DDD0' }}>
            <button
              type="button"
              onClick={() => toggleExpand(index)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#EDE7D5] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-[#0D0D0D]">Sample {sample.label}</span>
                {!sample.isExpanded && (
                  <span className="text-xs text-[#999]">
                    {sample.attributes.filter(a => a.value).map(a => a.name).join(' · ') || 'tap to edit'}
                  </span>
                )}
              </div>
              <span className="text-[#999] text-sm">{sample.isExpanded ? '▲' : '▼'}</span>
            </button>

            {sample.isExpanded && (
              <div className="px-5 py-4" style={{ borderTop: '0.5px solid #E5DDD0' }}>
                <SampleForm
                  blindId={blindId}
                  sample={sample}
                  nosingEnabled={nosingEnabled}
                  onChange={(data) => updateSample(index, data)}
                  onSave={() => handleSaveSample(index)}
                  onDelete={bonusMode || samples.length > 1 ? () => handleDeleteSample(index) : undefined}
                  isSaving={isPending}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSample}
        className="w-full py-3 border-2 border-dashed border-[#333] rounded-xl text-sm text-smoke hover:border-[#444] hover:text-parchment transition-colors mb-8"
      >
        + Add sample
      </button>

      {saveError && <p className="text-sm text-red-400 mb-3">{saveError}</p>}
      <div className="flex justify-between items-center">
        <Button variant="secondary" onClick={handleSaveAll} disabled={isPending}>
          Save draft
        </Button>
        <Button onClick={handleActivate} disabled={isPending || blindStatus === 'active'}>
          {blindStatus === 'active' ? 'Blind is active' : 'Activate blind →'}
        </Button>
      </div>
    </div>
  );
}
