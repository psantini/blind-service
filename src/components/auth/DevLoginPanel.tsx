'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const DEV_USERS = [
  { label: 'dev_host',    email: 'host@dev.test' },
  { label: 'dev_player1', email: 'player1@dev.test' },
  { label: 'dev_player2', email: 'player2@dev.test' },
  { label: 'dev_player3', email: 'player3@dev.test' },
];

export function DevLoginPanel({ redirectTo = '/dashboard' }: { redirectTo?: string } = {}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function signInAs(email: string, label: string) {
    setLoading(label);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: 'devpassword' });
    if (error) {
      setError(error.message);
      setLoading(null);
    } else {
      router.push(redirectTo);
    }
  }

  return (
    <div className="mt-8 border-t border-dashed border-[#333] pt-6">
      <p className="text-xs uppercase tracking-widest text-[#555] mb-3 text-center">Dev login</p>
      <div className="flex flex-col gap-2">
        {DEV_USERS.map(u => (
          <button
            key={u.email}
            onClick={() => signInAs(u.email, u.label)}
            disabled={!!loading}
            className="w-full px-4 py-2 rounded-lg border border-[#333] text-sm text-smoke hover:text-parchment hover:border-[#555] transition-colors disabled:opacity-40 font-mono text-left"
          >
            {loading === u.label ? 'Signing in…' : u.label}
          </button>
        ))}
      </div>
      {error && <p className="text-red-400 text-xs mt-3 text-center">{error}</p>}
    </div>
  );
}
