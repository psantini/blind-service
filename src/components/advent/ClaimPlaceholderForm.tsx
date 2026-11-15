'use client';

import { useState, useTransition } from 'react';
import { claimPlaceholderSlot } from '@/app/advent/[adventId]/join/actions';

interface Placeholder {
  id: string;
  name: string;
  bottlesExpected: number;
}

export function ClaimPlaceholderForm({
  adventId,
  placeholders,
}: {
  adventId: string;
  placeholders: Placeholder[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  function claim(rowId: string) {
    setError(null);
    setClaimingId(rowId);
    startTransition(async () => {
      try {
        await claimPlaceholderSlot({ adventId, manifestRowId: rowId });
        window.location.reload();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setClaimingId(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      {placeholders.map(p => (
        <button
          key={p.id}
          type="button"
          onClick={() => claim(p.id)}
          disabled={isPending}
          className="w-full text-left bg-cream rounded-xl px-5 py-4 flex items-center justify-between transition-colors hover:bg-[#EDE7D5] disabled:opacity-50"
          style={{ border: '0.5px solid #E5DDD0' }}
        >
          <div>
            <p className="text-sm font-medium text-[#0D0D0D]">{p.name}</p>
            <p className="text-xs text-muted mt-0.5">{p.bottlesExpected} bottle{p.bottlesExpected !== 1 ? 's' : ''} to submit</p>
          </div>
          <span className="text-sm text-[#666]">
            {isPending && claimingId === p.id ? 'Claiming…' : '→'}
          </span>
        </button>
      ))}
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      <p className="text-xs text-center text-muted pt-2">
        Only claim your own slot — you won&apos;t be able to change it later.
      </p>
    </div>
  );
}
