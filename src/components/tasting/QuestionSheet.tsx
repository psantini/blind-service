'use client';

import { useState, useTransition, useRef } from 'react';
import { saveAnswerDraft, submitSample, initAnswers } from '@/app/blinds/[blindId]/taste/[sampleId]/actions';
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
  nextSampleLabel?: string;
}

export function QuestionSheet({
  blindId,
  sampleId,
  sampleLabel,
  questions,
  existingAnswers,
  nextSampleLabel,
}: QuestionSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    existingAnswers.forEach(a => {
      if (a.value !== null) init[a.question_id] = a.value;
    });
    return init;
  });
  const [answerIds, setAnswerIds] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    existingAnswers.forEach(a => { init[a.question_id] = a.id; });
    return init;
  });
  const initialized = useRef(false);

  // Init answer rows on first render
  if (!initialized.current) {
    initialized.current = true;
    const missingIds = questions.map(q => q.id).filter(id => !answerIds[id]);
    if (missingIds.length > 0) {
      initAnswers(missingIds).catch(console.error);
    }
  }

  const finishedQuestion = questions.find(q => q.attribute.name === 'finished');
  const finishTypeQuestion = questions.find(q => q.attribute.name === 'finish_type');
  const finishedValue = finishedQuestion ? (values[finishedQuestion.id] ?? 'no') : null;

  function handleChange(questionId: string, value: string) {
    setValues(prev => ({ ...prev, [questionId]: value }));
    const answerId = answerIds[questionId];
    if (answerId) {
      saveAnswerDraft(answerId, value).catch(console.error);
    }
  }

  function handleSubmit() {
    startTransition(() => submitSample(blindId, sampleId));
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
            className={`bg-white border border-stone-200 rounded-xl p-4 ${
              isFinishType ? 'ml-4 border-stone-100 bg-stone-50' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-stone-800 capitalize">
                {attr.name === 'finish_type' ? 'Finish type' : attr.name}
              </label>
              <span className="text-xs text-stone-400">up to {maxPts} pts</span>
            </div>
            {attr.scoring_type === 'bracket' && (
              <p className="text-xs text-stone-400 mb-2">Scored by proximity — closer = more points</p>
            )}

            {isFinishType && finishedValue === 'no' && (
              <p className="text-xs text-stone-400 italic mb-2">
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

      <div className="flex items-center justify-between pt-2 border-t border-stone-200 mt-6">
        <p className="text-xs text-stone-400">
          {nextSampleLabel
            ? `Submitting reveals the answer and unlocks Sample ${nextSampleLabel}`
            : 'Submitting reveals the answer'}
        </p>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Submitting...' : `Submit Sample ${sampleLabel}`}
        </Button>
      </div>
    </div>
  );
}
