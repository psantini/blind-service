'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { logout } from '@/app/actions';

interface UserMenuProps {
  username: string;
  isSuperAdmin?: boolean;
  isGroupManager?: boolean;
}

export function UserMenu({ username, isSuperAdmin = false, isGroupManager = false }: UserMenuProps) {
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
          {isSuperAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-smoke hover:text-parchment hover:bg-[#1a1a1a] transition-colors"
            >
              Admin
            </Link>
          )}
          {isGroupManager && (
            <Link
              href="/groups"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-smoke hover:text-parchment hover:bg-[#1a1a1a] transition-colors"
            >
              Groups
            </Link>
          )}
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
