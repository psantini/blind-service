'use client';

import { useState } from 'react';

interface InviteLinkProps {
  token: string;
}

export function InviteLink({ token }: InviteLinkProps) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/join?token=${token}`;

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-xs font-mono text-muted truncate">/join?token={token.slice(0, 8)}…</span>
      <button
        onClick={copy}
        className="text-xs px-2 py-0.5 rounded border border-[#444] text-muted hover:text-parchment shrink-0 transition-colors"
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  );
}
