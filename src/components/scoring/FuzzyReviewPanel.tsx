'use client';

import { useTransition } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { reviewFuzzyAnswer } from '@/app/blinds/[blindId]/host/actions';

interface FuzzyAnswer {
  id: string;
  value: string;
  host_approved: boolean | null;
  user_id: string;
  profile: { discord_username: string } | null;
  question: {
    round: string;
    attribute: {
      name: string;
      value: string;
      sample: { label: string } | null;
    } | null;
  } | null;
}

interface FuzzyReviewPanelProps {
  blindId: string;
  answers: FuzzyAnswer[];
}

export function FuzzyReviewPanel({ blindId, answers }: FuzzyReviewPanelProps) {
  const [isPending, startTransition] = useTransition();

  function handleReview(answerId: string, approved: boolean) {
    startTransition(() => reviewFuzzyAnswer(blindId, answerId, approved));
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
          Fuzzy review
        </p>
        {answers.length > 0 && (
          <Badge variant="amber">{answers.length} pending</Badge>
        )}
      </div>

      {answers.length === 0 ? (
        <p className="px-5 py-4 text-sm text-stone-400">No pending fuzzy matches.</p>
      ) : (
        <div className="divide-y divide-stone-100">
          {answers.map(answer => {
            const attr = answer.question?.attribute;
            return (
              <div key={answer.id} className="px-5 py-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-medium text-stone-600">
                    {answer.profile?.discord_username} · Sample {attr?.sample?.label} · {attr?.name}
                  </p>
                  <Badge variant="default">{answer.question?.round}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm mb-3">
                  <span className="text-stone-500">They said:</span>
                  <span className="font-medium text-stone-900">{answer.value || '(blank)'}</span>
                  <span className="text-stone-300">→</span>
                  <span className="text-stone-500">Correct:</span>
                  <span className="font-medium text-stone-900">{attr?.value}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleReview(answer.id, true)}
                    disabled={isPending}
                    className="text-green-700 border-green-200 hover:bg-green-50"
                  >
                    ✓ Accept (3 pts)
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleReview(answer.id, false)}
                    disabled={isPending}
                    className="text-red-700 border-red-200 hover:bg-red-50"
                  >
                    ✕ Reject (0 pts)
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
