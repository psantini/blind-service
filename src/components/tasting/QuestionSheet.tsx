'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { saveAnswerDraft, submitSample, submitNosing, initAnswers } from '@/app/blinds/[blindId]/taste/[sampleId]/actions';
import { Button } from '@/components/ui/Button';
import { FreeTextQuestion } from './FreeTextQuestion';
import { NumericQuestion } from './NumericQuestion';
import { DropdownQuestion } from './DropdownQuestion';
import { YesNoQuestion } from './YesNoQuestion';
import { WHISKEY_TYPES } from '@/lib/constants/whiskeyTypes';

interface Question {
  id: string;
  round: string;
  attribute: {
    id: string;
    name: string;
    input_type: string;
    scoring_type: string;
    brackets: any;
  };
}

interface ExistingAnswer {
  id: string;
  question_id: string;
  value: string | null;
  submitted_at: string | null;
}

interface QuestionSheetProps {
  blindId: string;
  sampleId: string;
  sampleLabel: string;
  questions: Question[];
  existingAnswers: ExistingAnswer[];
  phase: 'nose' | 'taste';
  nextSampleLabel?: string;
}

export function QuestionSheet({
  blindId,
  sampleId,
  sampleLabel,
  questions,
  existingAnswers,
  phase,
  nextSampleLabel,
}: QuestionSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    existingAnswers.forEach(a => {
      if (a.value !== null) init[a.question_id] = a.value;
    });
    // Pre-populate boolean questions with 'no' so the visual default is persisted on submit
    for (const q of questions) {
      if (q.attribute.input_type === 'boolean' && init[q.id] === undefined) {
        init[q.id] = 'no';
      }
    }
    return init;
  });
  const [answerIds, setAnswerIds] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    existingAnswers.forEach(a => { init[a.question_id] = a.id; });
    return init;
  });
  const initialized = useRef(false);

  // Init answer rows exactly once, outside render via useEffect
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const missingIds = questions.map(q => q.id).filter(id => !answerIds[id]);
    if (missingIds.length > 0) {
      initAnswers(missingIds).catch(console.error);
    }
    // Persist the visual 'no' default for boolean questions that have no saved value yet
    for (const q of questions) {
      if (q.attribute.input_type === 'boolean') {
        const saved = existingAnswers.find(a => a.question_id === q.id)?.value;
        if (saved === null || saved === undefined) {
          saveAnswerDraft(q.id, 'no').catch(console.error);
        }
      }
    }
  // answerIds and existingAnswers intentionally omitted — snapshot at mount only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishedQuestion = questions.find(q => q.attribute.name === 'finished');
  const finishTypeQuestion = questions.find(q => q.attribute.name === 'finish_type');
  const finishedValue = finishedQuestion ? (values[finishedQuestion.id] ?? 'no') : null;

  function handleChange(questionId: string, value: string) {
    setValues(prev => ({ ...prev, [questionId]: value }));
    saveAnswerDraft(questionId, value).catch(console.error);
  }

  function handleSubmit() {
    if (phase === 'nose') {
      startTransition(async () => {
        const result = await submitNosing(blindId, sampleId);
        router.push(result.redirectTo);
      });
    } else {
      startTransition(() => submitSample(blindId, sampleId));
    }
  }

  // Sort questions: standard order, then custom
  const ORDER = ['distillery', 'type', 'age', 'proof', 'finished', 'finish_type'];
  const sortedQuestions = [...questions].sort((a, b) => {
    const ai = ORDER.indexOf(a.attribute.name);
    const bi = ORDER.indexOf(b.attribute.name);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div className="space-y-4">
      {sortedQuestions.map(q => {
        const attr = q.attribute;
        const value = values[q.id] ?? '';
        const isFinishType = attr.name === 'finish_type';
        const maxPts = attr.scoring_type === 'bracket' ? 5 : 3;

        // Finish type: always show, but conditionally hint
        if (isFinishType && !finishTypeQuestion) return null;

        return (
          <div
            key={q.id}
            className={`bg-cream rounded-xl p-4 ${isFinishType ? 'ml-4 bg-[#EDE7D5]' : ''}`}
            style={{ border: '0.5px solid #E5DDD0' }}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-[#0D0D0D] capitalize">
                {attr.name === 'finish_type' ? 'Finish type' : attr.name}
              </label>
              <span className="text-xs text-[#999]">up to {maxPts} pts</span>
            </div>
            {attr.scoring_type === 'bracket' && (
              <p className="text-xs text-[#999] mb-2">Scored by proximity — closer = more points</p>
            )}

            {isFinishType && finishedValue === 'no' && (
              <p className="text-xs text-[#999] italic mb-2">
                Optional — your finish type guess will still be scored even if you said No above.
              </p>
            )}

            {attr.name === 'finished' ? (
              <YesNoQuestion
                value={value || 'no'}
                onChange={v => handleChange(q.id, v)}
              />
            ) : attr.input_type === 'dropdown' ? (
              <DropdownQuestion
                value={value}
                options={WHISKEY_TYPES.map(t => ({ value: t, label: t }))}
                onChange={v => handleChange(q.id, v)}
              />
            ) : attr.input_type === 'numeric' ? (
              <NumericQuestion
                value={value}
                onChange={v => handleChange(q.id, v)}
                placeholder="0"
              />
            ) : (
              <FreeTextQuestion
                value={value}
                onChange={v => handleChange(q.id, v)}
                placeholder={attr.name === 'distillery' ? 'e.g. Buffalo Trace' : 'e.g. oloroso sherry'}
              />
            )}
          </div>
        );
      })}

      <div className="flex items-center justify-between pt-2 border-t border-[#222] mt-6">
        <p className="text-xs text-[#999]">
          {phase === 'nose'
            ? 'Submitting locks in your nose notes'
            : nextSampleLabel
            ? `Submitting reveals the answer and unlocks Sample ${nextSampleLabel}`
            : 'Submitting reveals the answer'}
        </p>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending
            ? 'Submitting...'
            : phase === 'nose'
            ? `Submit nosing — Sample ${sampleLabel}`
            : `Submit Sample ${sampleLabel}`}
        </Button>
      </div>
    </div>
  );
}
