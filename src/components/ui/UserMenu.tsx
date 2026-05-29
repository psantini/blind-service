'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { logout } from '@/app/actions';

interface UserMenuProps {
  username: string;
}

export function UserMenu({ username }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="uppercase tracking-[0.12em] text-smoke hover:text-parchment transition-colors truncate max-w-[96px]"
        style={{ fontSize: '11px' }}
      >
        {username}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-40 rounded-xl overflow-hidden z-50"
          style={{ background: '#111', border: '0.5px solid #2a2a2a' }}
        >
          <button
            onClick={() => startTransition(() => logout())}
            disabled={isPending}
            className="w-full text-left px-4 py-3 text-sm text-smoke hover:text-parchment hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
          >
            {isPending ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}
