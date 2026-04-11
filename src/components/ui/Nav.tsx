import Link from 'next/link';
import { Profile } from '@/types';

interface NavProps {
  profile?: Profile | null;
  backHref?: string;
  backLabel?: string;
}

export function Nav({ profile, backHref, backLabel }: NavProps) {
  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="w-24">
          {backHref ? (
            <Link
              href={backHref}
              className="text-sm text-stone-500 hover:text-stone-900 flex items-center gap-1"
            >
              ← {backLabel ?? 'Back'}
            </Link>
          ) : null}
        </div>

        <Link href="/dashboard" className="font-semibold text-stone-900 text-base">
          Whiskey Blind
        </Link>

        <div className="w-24 flex justify-end">
          {profile && (
            <span className="text-sm text-stone-500 truncate max-w-[96px]">
              {profile.discord_username}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
