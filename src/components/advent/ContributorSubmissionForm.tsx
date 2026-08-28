'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { WHISKEY_TYPES } from '@/lib/constants/whiskeyTypes';
import { createClient } from '@/lib/supabase/client';
import { submitContributorBottles } from '@/app/advent/[adventId]/join/actions';

interface AdventAttributeTemplate {
  name: string;
  inputType: 'text' | 'dropdown' | 'numeric' | 'boolean';
  scoringType: string;
  brackets: Array<{ max_delta: number; points: number }> | null;
}

interface FieldState {
  name: string;
  inputType: string;
  scoringType: string;
  brackets: Array<{ max_delta: number; points: number }> | null;
  value: string;
  isNA: boolean;
}

interface BottleState {
  photoFile: File | null;
  photoUrl: string | null;
  isUploading: boolean;
  uploadError: string | null;
  fields: FieldState[];
}

interface Assignment {
  letter: string;
  photoUrl: string;
}

function buildInitialFields(templates: AdventAttributeTemplate[]): FieldState[] {
  return templates.map(t => ({
    name: t.name,
    inputType: t.inputType,
    scoringType: t.scoringType,
    brackets: t.brackets,
    value: t.inputType === 'boolean' ? 'no' : '',
    isNA: false,
  }));
}

function buildInitialBottle(templates: AdventAttributeTemplate[]): BottleState {
  return {
    photoFile: null,
    photoUrl: null,
    isUploading: false,
    uploadError: null,
    fields: buildInitialFields(templates),
  };
}

export function ContributorSubmissionForm({
  adventId,
  blindId,
  bottlesExpected,
  questionTemplates,
}: {
  adventId: string;
  blindId: string;
  bottlesExpected: number;
  questionTemplates: AdventAttributeTemplate[];
}) {
  const [bottles, setBottles] = useState<BottleState[]>(() =>
    Array.from({ length: bottlesExpected }, () => buildInitialBottle(questionTemplates))
  );
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allPhotosUploaded = bottles.every(b => b.photoUrl !== null);
  const anyUploading = bottles.some(b => b.isUploading);
  const canSubmit = allPhotosUploaded && !anyUploading && !isPending;

  async function handlePhotoUpload(bottleIdx: number, file: File) {
    setBottles(prev => prev.map((b, i) => i === bottleIdx ? { ...b, isUploading: true, uploadError: null } : b));
    try {
      const supabase = createClient();
      const path = `${blindId}/advent/${Date.now()}_${bottleIdx}.jpg`;
      const { error: uploadError } = await supabase.storage.from('bottle-images').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('bottle-images').getPublicUrl(path);
      setBottles(prev => prev.map((b, i) => i === bottleIdx ? { ...b, photoUrl: publicUrl, isUploading: false } : b));
    } catch (err: any) {
      setBottles(prev => prev.map((b, i) => i === bottleIdx
        ? { ...b, isUploading: false, uploadError: err?.message ?? 'Upload failed' }
        : b
      ));
    }
  }

  function handleFieldChange(bottleIdx: number, fieldIdx: number, value: string) {
    setBottles(prev => prev.map((b, bi) => {
      if (bi !== bottleIdx) return b;
      const fields = [...b.fields];
      fields[fieldIdx] = { ...fields[fieldIdx]!, value };

      // finished → finish_type conditional
      if (fields[fieldIdx]!.name === 'finished') {
        const hasFinishType = fields.some(f => f.name === 'finish_type');
        if (value === 'yes' && !hasFinishType) {
          fields.splice(fieldIdx + 1, 0, {
            name: 'finish_type',
            inputType: 'text',
            scoringType: 'exact',
            brackets: null,
            value: '',
            isNA: false,
          });
        } else if (value !== 'yes' && hasFinishType) {
          const ftIdx = fields.findIndex(f => f.name === 'finish_type');
          fields.splice(ftIdx, 1);
        }
      }

      return { ...b, fields };
    }));
  }

  function handleNAToggle(bottleIdx: number, fieldIdx: number) {
    setBottles(prev => prev.map((b, bi) => {
      if (bi !== bottleIdx) return b;
      const fields = b.fields.map((f, fi) => fi === fieldIdx ? { ...f, isNA: !f.isNA, value: !f.isNA ? 'N/A' : '' } : f);
      return { ...b, fields };
    }));
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await submitContributorBottles({
          adventId,
          bottles: bottles.map(b => ({
            photoUrl: b.photoUrl!,
            fields: b.fields.map(f => ({
              name: f.name,
              inputType: f.inputType,
              scoringType: f.scoringType,
              brackets: f.brackets,
              value: f.isNA ? 'N/A' : f.value,
            })),
          })),
        });
        setAssignments(result.assignments);
      } catch (err: any) {
        setError(err?.message ?? 'Something went wrong');
      }
    });
  }

  // ── Confirmation screen ───────────────────────────────────────────────────
  if (assignments.length > 0) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-2xl font-display italic font-bold text-parchment mb-1">You&apos;re in!</p>
          <p className="text-smoke text-sm">Label your bottles with these letters before handing them over to the host:</p>
        </div>
        <div className="space-y-3">
          {assignments.map(a => (
            <div key={a.letter} className="bg-cream rounded-xl p-5 flex items-center gap-6" style={{ border: '0.5px solid #E5DDD0' }}>
              <span className="text-6xl font-display font-bold text-[#0D0D0D] w-14 text-center shrink-0">{a.letter}</span>
              {a.photoUrl && (
                <img src={a.photoUrl} alt={`Bottle ${a.letter}`} className="h-32 w-auto rounded object-contain" style={{ border: '0.5px solid #E5DDD0' }} />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-[#666]">The blind will be generated automatically once all contributors have submitted.</p>
      </div>
    );
  }

  // ── Submission form ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {bottles.map((bottle, bi) => (
        <div key={bi} className="bg-cream rounded-xl p-6 space-y-5" style={{ border: '0.5px solid #E5DDD0' }}>
          <p className="text-xs font-semibold text-[#666] uppercase tracking-wider">Bottle {bi + 1}</p>

          {/* Photo upload */}
          <div>
            <label className="text-sm font-medium text-[#0D0D0D] block mb-1.5">
              Bottle photo <span className="text-red-400">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={bottle.isUploading}
              className="text-sm text-[#666]"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(bi, file);
              }}
            />
            {bottle.isUploading && <p className="text-xs text-[#999] mt-1">Uploading…</p>}
            {bottle.uploadError && <p className="text-xs text-red-400 mt-1">{bottle.uploadError}</p>}
            {bottle.photoUrl && !bottle.isUploading && (
              <img src={bottle.photoUrl} alt="Bottle" className="mt-2 h-24 w-auto rounded object-contain" style={{ border: '0.5px solid #E5DDD0' }} />
            )}
          </div>

          {/* Attribute fields */}
          <div className="space-y-3">
            {bottle.fields.map((field, fi) => {
              const isFinishType = field.name === 'finish_type';
              return (
                <div
                  key={`${field.name}-${fi}`}
                  className={`rounded-lg p-3 ${isFinishType ? 'ml-4 bg-[#EDE7D5]' : ''}`}
                  style={{ border: '0.5px solid #E5DDD0' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[#0D0D0D] capitalize">
                      {field.name === 'finish_type' ? 'Finish type' : field.name}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleNAToggle(bi, fi)}
                      className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                        field.isNA
                          ? 'bg-amber text-black border-amber'
                          : 'bg-[#EDE7D5] text-[#999] border-[#E5DDD0] hover:border-[#C9B99A]'
                      }`}
                    >
                      N/A
                    </button>
                  </div>

                  {!field.isNA && (
                    <>
                      {field.name === 'finished' || field.inputType === 'boolean' ? (
                        <div className="flex gap-2">
                          {['no', 'yes'].map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => handleFieldChange(bi, fi, v)}
                              className={`flex-1 py-1.5 rounded text-sm font-medium border transition-colors ${
                                field.value === v
                                  ? 'bg-amber text-black border-amber'
                                  : 'bg-[#EDE7D5] text-[#666] border-[#E5DDD0] hover:border-[#C9B99A]'
                              }`}
                            >
                              {v === 'yes' ? 'Yes' : 'No'}
                            </button>
                          ))}
                        </div>
                      ) : field.inputType === 'dropdown' ? (
                        <Dropdown
                          value={field.value}
                          options={WHISKEY_TYPES.map(t => ({ value: t, label: t }))}
                          onChange={e => handleFieldChange(bi, fi, e.target.value)}
                        />
                      ) : field.inputType === 'numeric' ? (
                        <Input
                          type="number"
                          value={field.value}
                          onChange={e => handleFieldChange(bi, fi, e.target.value)}
                          placeholder="0"
                          step="0.1"
                          min="0"
                        />
                      ) : (
                        <Input
                          value={field.value}
                          onChange={e => handleFieldChange(bi, fi, e.target.value)}
                          placeholder="Enter value"
                        />
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {!allPhotosUploaded && (
        <p className="text-xs text-amber">Upload a photo for each bottle before submitting.</p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {isPending ? 'Submitting…' : 'Submit bottles →'}
        </Button>
      </div>
    </div>
  );
}
