'use client';

import { useState, useTransition } from 'react';

interface DestructiveButtonProps {
  label: string;
  confirmLabel?: string;
  action: () => Promise<void>;
}

export function DestructiveButton({ label, confirmLabel = 'Confirm delete', action }: DestructiveButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5">
        <button
          onClick={() => startTransition(async () => { await action(); setConfirming(false); })}
          disabled={isPending}
          className="text-xs px-2 py-1 rounded bg-red-700 text-white font-semibold hover:bg-red-600 disabled:opacity-50"
        >
          {isPending ? 'Deleting…' : confirmLabel}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="text-xs px-2 py-1 rounded border border-[#444] text-muted hover:text-parchment"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs px-2 py-1 rounded border border-[#444] text-muted hover:border-red-700 hover:text-red-400 transition-colors"
    >
      {label}
    </button>
  );
}
