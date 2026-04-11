import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Nav } from '@/components/ui/Nav';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ blindId: string }>;
}) {
  const { blindId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: blind } = await supabase
    .from('blinds')
    .select(`
      id, name, status, nosing_enabled,
      blind_members (
        user_id, role,
        profile:profiles!user_id ( id, discord_username, discord_avatar_url )
      ),
      samples ( id, label, display_order )
    `)
    .eq('id', blindId)
    .single();

  if (!blind) redirect('/dashboard');

  const samples = (blind.samples as any[]).sort((a, b) => a.display_order - b.display_order);
  const sampleIds = samples.map((s: any) => s.id);

  // Get all questions for these samples
  const { data: attributeRows } = sampleIds.length > 0
    ? await supabase.from('attributes').select('id').in('sample_id', sampleIds)
    : { data: [] };

  const attrIds = attributeRows?.map((a: any) => a.id) ?? [];

  const { data: questionRows } = attrIds.length > 0
    ? await supabase.from('questions').select('id, round').in('attribute_id', attrIds)
    : { data: [] };

  const questionIds = questionRows?.map((q: any) => q.id) ?? [];

  // Get all submitted answers with profiles
  const { data: answers } = questionIds.length > 0
    ? await supabase
        .from('answers')
        .select(`
          id, user_id, question_id, points_earned, fuzzy_flagged, host_approved,
          profile:profiles!user_id ( id, discord_username, discord_avatar_url )
        `)
        .in('question_id', questionIds)
        .not('submitted_at', 'is', null)
    : { data: [] };

  // Compute scores per user
  const questionRoundMap = Object.fromEntries(
    (questionRows ?? []).map((q: any) => [q.id, q.round])
  );

  const scoreMap: Record<string, {
    profile: any;
    total: number;
    nose: number;
    taste: number;
    pending: number;
  }> = {};

  for (const answer of (answers ?? []) as any[]) {
    if (!scoreMap[answer.user_id]) {
      scoreMap[answer.user_id] = {
        profile: answer.profile,
        total: 0,
        nose: 0,
        taste: 0,
        pending: 0,
      };
    }
    const pts = answer.points_earned ?? 0;
    const round = questionRoundMap[answer.question_id];
    if (answer.fuzzy_flagged && answer.host_approved === null) {
      scoreMap[answer.user_id].pending++;
    } else {
      scoreMap[answer.user_id].total += pts;
      if (round === 'nose') scoreMap[answer.user_id].nose += pts;
      if (round === 'taste') scoreMap[answer.user_id].taste += pts;
    }
  }

  const ranked = Object.values(scoreMap).sort((a, b) => b.total - a.total);

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav profile={profile} backHref={`/blinds/${blindId}`} backLabel="Lobby" />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">{(blind as any).name}</h1>
        <p className="text-stone-500 text-sm mb-6">
          {samples.length} samples · {(blind as any).nosing_enabled ? 'Nose + Taste' : 'Taste only'}
        </p>
        <Leaderboard
          entries={ranked}
          currentUserId={user.id}
          nosingEnabled={(blind as any).nosing_enabled}
        />
      </div>
    </div>
  );
}
