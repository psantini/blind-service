'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createBlind } from '@/app/blinds/new/actions';

interface GuildOption {
  id: string;
  name: string;
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
        enabled ? 'bg-amber' : 'bg-[#C8BFB0]'
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-parchment rounded-full shadow transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function NewBlindForm({ guilds, isSuperAdmin = false }: { guilds: GuildOption[]; isSuperAdmin?: boolean }) {
  const [nosingEnabled, setNosingEnabled] = useState(false);
  const [roundOrder, setRoundOrder] = useState<'interleaved' | 'all_nose_first'>('interleaved');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('nosing_enabled', String(nosingEnabled));
    formData.set('round_order', nosingEnabled ? roundOrder : 'interleaved');
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
        <Toggle enabled={nosingEnabled} onChange={() => setNosingEnabled(v => !v)} />
      </div>

      {nosingEnabled && (
        <div className="space-y-2 pl-1">
          <p className="text-xs font-medium text-[#666] uppercase tracking-wider">Round order</p>
          {(
            [
              { value: 'interleaved', label: 'Interleaved', description: 'Nose + taste each sample before moving on' },
              { value: 'all_nose_first', label: 'All nose first', description: 'Complete nosing for every sample, then taste' },
            ] as const
          ).map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRoundOrder(option.value)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                roundOrder === option.value
                  ? 'border-amber bg-amber/10 text-[#0D0D0D]'
                  : 'border-[#E5DDD0] bg-[#EDE7D5] text-[#666] hover:border-[#C9B99A]'
              }`}
            >
              <p className="text-sm font-medium">{option.label}</p>
              <p className="text-xs mt-0.5 text-[#666]">{option.description}</p>
            </button>
          ))}
        </div>
      )}

      {guilds.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-[#0D0D0D] mb-1.5">Discord server</label>
          <select
            name="group_id"
            defaultValue=""
            className="w-full rounded-lg border border-[#E5DDD0] bg-[#EDE7D5] text-[#0D0D0D] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
          >
            {isSuperAdmin && <option value="">None (any authenticated user)</option>}
            {guilds.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create blind →'}
        </Button>
      </div>
    </form>
  );
}
