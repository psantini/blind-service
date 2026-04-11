import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Nav } from '@/components/ui/Nav';
import { StatCard } from '@/components/leaderboard/StatCard';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: stats } = await supabase
    .from('all_time_stats')
    .select('*')
    .order('total_points', { ascending: false });

  const myStats = stats?.find(s => s.user_id === user.id);

  const leaderboardEntries = (stats ?? []).map(s => ({
    profile: {
      id: s.user_id,
      discord_username: s.discord_username,
      discord_avatar_url: s.discord_avatar_url,
    },
    total: Number(s.total_points),
    nose: Number(s.total_nose_points),
    taste: Number(s.total_taste_points),
    pending: 0,
  }));

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav profile={profile} backHref="/dashboard" backLabel="Dashboard" />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-6">All-time stats</h1>

        {myStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard label="Blinds played" value={Number(myStats.blinds_participated)} />
            <StatCard label="Your total pts" value={Number(myStats.total_points)} />
            <StatCard label="Blinds hosted" value={Number(myStats.blinds_hosted)} />
            <StatCard
              label="Avg pts/answer"
              value={Number(myStats.avg_points_per_answer).toFixed(1)}
            />
          </div>
        )}

        <Leaderboard
          entries={leaderboardEntries}
          currentUserId={user.id}
          nosingEnabled={true}
        />
      </div>
    </div>
  );
}
