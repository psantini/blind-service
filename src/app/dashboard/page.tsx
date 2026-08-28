import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/ui/Nav';
import { BlindCard } from '@/components/blind/BlindCard';
import { Badge } from '@/components/ui/Badge';
import { GroupBadge } from '@/components/ui/GroupBadge';
import { BlindStatus } from '@/types';

const STATUS_BADGE: Record<BlindStatus, { label: string; variant: 'green' | 'amber' | 'grey' }> = {
  active:   { label: 'Active',   variant: 'green' },
  setup:    { label: 'Setup',    variant: 'amber' },
  complete: { label: 'Complete', variant: 'grey'  },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const adminClient = createAdminClient();

  // Fetch user's memberships with role
  const { data: memberships } = await supabase
    .from('blind_members')
    .select('blind_id, role')
    .eq('user_id', user.id);

  const { data: groupAdminMemberships } = await adminClient
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .limit(1);

  const isGroupManager = (profile?.is_super_admin ?? false) || (groupAdminMemberships ?? []).length > 0;

  const myBlindIds = memberships?.map(m => m.blind_id) ?? [];
  const hostedIds = new Set<string>(memberships?.filter(m => m.role === 'host').map(m => m.blind_id) ?? []);
  const joinedIds = new Set<string>(memberships?.filter(m => m.role !== 'host').map(m => m.blind_id) ?? []);

  const MEMBER_SELECT = `
    id, name, status, nosing_enabled, created_at,
    host:profiles!host_id ( id, discord_username, discord_avatar_url ),
    blind_members ( user_id, role, profile:profiles!user_id ( id, discord_username, discord_avatar_url ) ),
    samples ( id ),
    group:groups ( name, icon_url )
  `;

  const { data: myBlinds } = myBlindIds.length > 0
    ? await supabase
        .from('blinds')
        .select(MEMBER_SELECT)
        .in('id', myBlindIds)
        .order('created_at', { ascending: false })
    : { data: [] };

  const hostedBlinds = (myBlinds ?? []).filter(b => hostedIds.has(b.id));
  const joinedBlinds = (myBlinds ?? []).filter(b => joinedIds.has(b.id));

  // Map blind_id → advent_calendar id for setup-phase advent blinds the user hosts
  const hostedSetupIds = hostedBlinds.filter(b => b.status === 'setup').map(b => b.id);
  const { data: adventRows } = hostedSetupIds.length > 0
    ? await adminClient
        .from('advent_calendars')
        .select('id, blind_id')
        .in('blind_id', hostedSetupIds)
    : { data: [] };
  const adventByBlindId = Object.fromEntries(
    (adventRows ?? []).map((a: any) => [a.blind_id, a.id])
  );

  // Public blinds: all active/setup blinds the user hasn't joined
  const { data: publicBlinds } = await supabase
    .from('blinds')
    .select(`
      id, name, status, nosing_enabled, created_at,
      host:profiles!host_id ( id, discord_username, discord_avatar_url ),
      samples ( id ),
      group:groups ( name, icon_url )
    `)
    .in('status', ['active', 'setup'])
    .order('created_at', { ascending: false });

  const discoverBlinds = (publicBlinds ?? []).filter(b => !myBlindIds.includes(b.id));

  return (
    <div className="min-h-screen">
      <Nav profile={profile} isGroupManager={isGroupManager} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-display italic font-bold text-parchment">Dashboard</h1>
          <Link
            href="/blinds/new"
            className="bg-amber hover:bg-amber/80 text-black text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New blind
          </Link>
        </div>

        {/* Hosting */}
        <section className="mb-8">
          <p className="text-xs font-semibold text-smoke uppercase tracking-wider mb-3">Hosting</p>
          {hostedBlinds.length === 0 ? (
            <p className="text-sm text-muted">You are not hosting any blinds yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {hostedBlinds.map(blind => (
                <BlindCard key={blind.id} blind={blind as any} currentUserId={user.id} adventId={adventByBlindId[blind.id]} />
              ))}
            </div>
          )}
        </section>

        <hr className="border-[#222] mb-8" />

        {/* Joined */}
        <section className="mb-8">
          <p className="text-xs font-semibold text-smoke uppercase tracking-wider mb-3">Joined</p>
          {joinedBlinds.length === 0 ? (
            <p className="text-sm text-muted">You have not joined any blinds yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {joinedBlinds.map(blind => (
                <BlindCard key={blind.id} blind={blind as any} currentUserId={user.id} />
              ))}
            </div>
          )}
        </section>

        <hr className="border-[#222] mb-8" />

        {/* Discover */}
        <section>
          <p className="text-xs font-semibold text-smoke uppercase tracking-wider mb-3">Discover</p>
          {discoverBlinds.length === 0 ? (
            <p className="text-sm text-muted">No open blinds to join right now.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {discoverBlinds.map(blind => {
                const badge = STATUS_BADGE[blind.status as BlindStatus];
                const host = blind.host as unknown as { discord_username: string } | null;
                const group = blind.group as unknown as { name: string; icon_url: string | null } | null;
                const sampleCount = (blind.samples as { id: string }[]).length;
                return (
                  <Link key={blind.id} href={`/blinds/${blind.id}`} className="block">
                    <div className="bg-cream rounded-xl px-5 py-4 hover:border-[#C9B99A] transition-colors" style={{ border: '0.5px solid #E5DDD0' }}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-[#0D0D0D] truncate block">{blind.name}</span>
                          <p className="text-xs text-[#666] mt-1 flex items-center gap-1.5 flex-wrap">
                            <span>{sampleCount} sample{sampleCount !== 1 ? 's' : ''} · {blind.nosing_enabled ? 'Nose + Taste' : 'Taste only'}{host && ` · hosted by ${host.discord_username}`}</span>
                            {group && <GroupBadge group={group} />}
                          </p>
                        </div>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
