import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/ui/Nav';
import { BlindCard } from '@/components/blind/BlindCard';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: blinds } = await supabase
    .from('blinds')
    .select(`
      id,
      name,
      status,
      nosing_enabled,
      created_at,
      host:profiles!host_id (
        id,
        discord_username,
        discord_avatar_url
      ),
      blind_members (
        user_id,
        role,
        profile:profiles!user_id (
          id,
          discord_username,
          discord_avatar_url
        )
      ),
      samples ( id )
    `)
    .order('created_at', { ascending: false });

  const activeOrSetup = blinds?.filter(b => b.status !== 'complete') ?? [];
  const completed = blinds?.filter(b => b.status === 'complete') ?? [];

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav profile={profile} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Your blinds</h1>
          <Link
            href="/blinds/new"
            className="bg-stone-900 hover:bg-stone-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New blind
          </Link>
        </div>

        {activeOrSetup.length > 0 && (
          <section className="mb-8">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Active</p>
            <div className="flex flex-col gap-3">
              {activeOrSetup.map(blind => (
                <BlindCard
                  key={blind.id}
                  blind={blind as any}
                  currentUserId={user.id}
                />
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <>
            <hr className="border-stone-200 mb-6" />
            <section>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Completed</p>
              <div className="flex flex-col gap-3 opacity-70">
                {completed.map(blind => (
                  <BlindCard
                    key={blind.id}
                    blind={blind as any}
                    currentUserId={user.id}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {blinds?.length === 0 && (
          <div className="text-center py-16 text-stone-400">
            <p className="text-lg">No blinds yet.</p>
            <p className="text-sm mt-1">Create one or wait for someone to share a link.</p>
          </div>
        )}
      </div>
    </div>
  );
}
