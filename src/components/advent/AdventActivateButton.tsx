'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { activateBlind } from '@/app/blinds/[blindId]/host/setup/actions';

export function AdventActivateButton({ blindId }: { blindId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleActivate() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await activateBlind(blindId);
        router.push(result.redirectTo);
      } catch (err: any) {
        setError(err?.message ?? 'Something went wrong');
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        onClick={handleActivate}
        disabled={isPending}
        className="inline-flex items-center bg-amber text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-amber/90 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Activating…' : 'Activate blind →'}
      </button>
    </div>
  );
}
