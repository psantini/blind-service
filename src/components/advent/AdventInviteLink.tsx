'use client';

import { useState } from 'react';

export function AdventInviteLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-cream rounded-xl p-6 space-y-3" style={{ border: '0.5px solid #E5DDD0' }}>
      <p className="text-xs font-semibold text-[#666] uppercase tracking-wider">Invite link</p>
      <div className="flex items-center gap-3">
        <code className="flex-1 text-sm text-[#0D0D0D] bg-[#EDE7D5] rounded px-3 py-2 truncate">
          {path}
        </code>
        <button
          onClick={handleCopy}
          className="text-sm font-semibold px-4 py-2 rounded-lg bg-amber text-black hover:bg-amber/90 transition-colors shrink-0"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-xs text-[#999]">Share this with all contributors so they can submit their bottles.</p>
    </div>
  );
}
