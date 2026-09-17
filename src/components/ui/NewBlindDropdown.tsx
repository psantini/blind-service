'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export function NewBlindDropdown({ showAdvent }: { showAdvent: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!showAdvent) {
    return (
      <Link
        href="/blinds/new"
        className="bg-amber hover:bg-amber/80 text-black text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        + New blind
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-amber hover:bg-amber/80 text-black text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
      >
        + New blind
        <span className="text-[10px] leading-none">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 w-44 bg-cream rounded-xl overflow-hidden z-20"
          style={{ border: '0.5px solid #E5DDD0' }}
        >
          <Link
            href="/blinds/new"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm text-[#0D0D0D] hover:bg-[#EDE7D5] transition-colors"
          >
            Regular blind
          </Link>
          <Link
            href="/advent/new"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm text-[#0D0D0D] hover:bg-[#EDE7D5] transition-colors border-t border-[#E5DDD0]"
          >
            Advent calendar
          </Link>
        </div>
      )}
    </div>
  );
}
