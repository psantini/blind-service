import Link from 'next/link';
import { Profile } from '@/types';
import { UserMenu } from './UserMenu';

interface NavProps {
  profile?: Profile | null;
  backHref?: string;
  backLabel?: string;
  isGroupManager?: boolean;
}

export function Nav({ profile, backHref, backLabel, isGroupManager }: NavProps) {
  return (
    <nav style={{ background: '#000', borderBottom: '0.5px solid #1a1a1a' }}>
      <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
        <div className="w-24">
          {backHref ? (
            <Link
              href={backHref}
              className="flex items-center gap-1 uppercase tracking-[0.12em] text-smoke hover:text-parchment transition-colors"
              style={{ fontSize: '11px' }}
            >
              ← {backLabel ?? 'Back'}
            </Link>
          ) : null}
        </div>

        <Link href="/dashboard" className="flex items-center gap-3">
          <span
            className="flex items-center justify-center rounded-full bg-amber text-black font-display italic font-semibold"
            style={{ width: 40, height: 40, fontSize: 14 }}
          >
            BBC
          </span>
          <span className="font-display italic font-semibold text-parchment" style={{ fontSize: 22 }}>
            Whiskey Blind
          </span>
        </Link>

        <div className="w-24 flex justify-end">
          {profile && (
            <UserMenu
              username={profile.discord_username}
              isSuperAdmin={profile.is_super_admin}
              isGroupManager={isGroupManager ?? profile.is_super_admin}
            />
          )}
        </div>
      </div>
    </nav>
  );
}
