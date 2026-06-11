import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { DestructiveButton } from '@/components/admin/DestructiveButton';
import { deleteBlind, deleteUser } from './actions';

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: profiles }, { data: blinds }, { data: guilds }, { data: { user } }] = await Promise.all([
    supabase.from('profiles').select('id, discord_username, is_super_admin, discord_guild_ids').order('discord_username'),
    supabase
      .from('blinds')
      .select('id, name, status, created_at, nosing_enabled, host:profiles!host_id(discord_username)')
      .order('created_at', { ascending: false }),
    supabase.from('guilds').select('id, discord_guild_id, name').order('name'),
    supabase.auth.getUser(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display italic font-bold text-parchment">Overview</h1>
        <Link href="/admin/groups" className="text-xs uppercase tracking-[0.12em] text-smoke hover:text-parchment transition-colors">
          Groups →
        </Link>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Users', value: profiles?.length ?? 0 },
            { label: 'Blinds', value: blinds?.length ?? 0 },
            { label: 'Active', value: blinds?.filter(b => b.status === 'active').length ?? 0 },
            { label: 'Complete', value: blinds?.filter(b => b.status === 'complete').length ?? 0 },
          ].map(stat => (
            <div key={stat.label} className="bg-cream rounded-xl p-4 text-center" style={{ border: '0.5px solid #E5DDD0' }}>
              <p className="text-3xl font-bold text-[#0D0D0D]">{stat.value}</p>
              <p className="text-xs text-[#666] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-parchment mb-3">Users</h2>
        <div className="bg-cream rounded-xl overflow-hidden" style={{ border: '0.5px solid #E5DDD0' }}>
          <div className="divide-y divide-[#E5DDD0]">
            {profiles?.map(p => {
              const memberGuilds = (guilds ?? []).filter(g =>
                (p.discord_guild_ids as string[] ?? []).includes(g.discord_guild_id)
              );
              const canDelete = !p.is_super_admin && p.id !== user?.id;
              return (
                <div key={p.id} className="flex items-center justify-between px-5 py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#E5DDD0] flex items-center justify-center text-xs font-bold text-[#0D0D0D] shrink-0">
                      {p.discord_username?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm text-[#0D0D0D]">{p.discord_username}</span>
                      {memberGuilds.length > 0 && (
                        <p className="text-xs text-muted mt-0.5">
                          {memberGuilds.map(g => g.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {p.is_super_admin && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber text-black font-semibold">admin</span>
                    )}
                    {canDelete && (
                      <DestructiveButton
                        label="Remove"
                        confirmLabel="Confirm remove"
                        action={deleteUser.bind(null, p.id)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-parchment mb-3">All Blinds</h2>
        <div className="bg-cream rounded-xl overflow-hidden" style={{ border: '0.5px solid #E5DDD0' }}>
          <div className="divide-y divide-[#E5DDD0]">
            {blinds?.map(b => (
              <div key={b.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="min-w-0">
                  <Link href={`/admin/blinds/${b.id}`} className="text-sm font-medium text-[#0D0D0D] hover:text-amber transition-colors">
                    {b.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {(b.host as any)?.discord_username ?? '—'} · {new Date(b.created_at).toLocaleDateString()}
                    {b.nosing_enabled && ' · nosing'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    b.status === 'active' ? 'bg-green-900/40 text-green-400' :
                    b.status === 'complete' ? 'bg-[#333] text-muted' :
                    'bg-amber/20 text-amber'
                  }`}>
                    {b.status}
                  </span>
                  <DestructiveButton
                    label="Delete"
                    action={deleteBlind.bind(null, b.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
