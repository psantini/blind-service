'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createBlind } from '@/app/blinds/new/actions';

export function NewBlindForm() {
  const [nosingEnabled, setNosingEnabled] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('nosing_enabled', String(nosingEnabled));
    startTransition(() => createBlind(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="bg-cream rounded-xl p-6 space-y-6" style={{ border: '0.5px solid #E5DDD0' }}>
      <div>
        <label className="block text-sm font-medium text-[#0D0D0D] mb-1.5">
          Blind name
        </label>
        <Input
          name="name"
          placeholder="e.g. Spring Blind #3"
          required
          autoFocus
        />
      </div>

      <div className="flex items-center justify-between py-1">
        <div>
          <p className="text-sm font-medium text-[#0D0D0D]">Nosing round</p>
          <p className="text-xs text-[#666] mt-0.5">Add a separate round for nosing before tasting</p>
        </div>
        <button
          type="button"
          onClick={() => setNosingEnabled(v => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
            nosingEnabled ? 'bg-amber' : 'bg-[#C8BFB0]'
          }`}
          role="switch"
          aria-checked={nosingEnabled}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-parchment rounded-full shadow transition-transform ${
              nosingEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create blind →'}
        </Button>
      </div>
    </form>
  );
}
