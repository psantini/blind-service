import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Nav } from '@/components/ui/Nav';
import { HostDashboard } from '@/components/blind/HostDashboard';

export default async function HostDashboardPage({
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
      id,
      name,
      status,
      nosing_enabled,
      host_id,
      samples (
        id,
        label,
        display_order,
        sample_reveals ( user_id, revealed_at )
      ),
      blind_members (
        user_id,
        role,
        profile:profiles!user_id (
          id,
          discord_username,
          discord_avatar_url
        )
      )
    `)
    .eq('id', blindId)
    .single();

  if (!blind || blind.host_id !== user.id) redirect('/dashboard');

  // Fetch pending fuzzy review items
  const sampleIds = (blind.samples as any[]).map((s: any) => s.id);
  const { data: questionIds } = sampleIds.length > 0
    ? await supabase
        .from('questions')
        .select('id, round')
        .in('attribute_id',
          (await supabase
            .from('attributes')
            .select('id')
            .in('sample_id', sampleIds)
          ).data?.map((a: any) => a.id) ?? []
        )
    : { data: [] };

  const qIds = questionIds?.map((q: any) => q.id) ?? [];

  // Fetch all submitted answers for live standings
  const { data: allAnswers } = qIds.length > 0
    ? await supabase
        .from('answers')
        .select(`
          user_id, question_id, points_earned, fuzzy_flagged, host_approved, value,
          profile:profiles!user_id ( id, discord_username, discord_avatar_url ),
          question:questions!question_id (
            attribute:attributes!attribute_id ( name, value, sample_id )
          )
        `)
        .in('question_id', qIds)
        .not('submitted_at', 'is', null)
    : { data: [] };

  const questionRoundMap = Object.fromEntries(
    (questionIds ?? []).map((q: any) => [q.id, q.round])
  );

  const scoreMap: Record<string, { profile: any; total: number; nose: number; taste: number; pending: number }> = {};
  for (const answer of (allAnswers ?? []) as any[]) {
    if (!scoreMap[answer.user_id]) {
      scoreMap[answer.user_id] = { profile: answer.profile, total: 0, nose: 0, taste: 0, pending: 0 };
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

  const { data: fuzzyAnswers } = qIds.length > 0
    ? await supabase
        .from('answers')
        .select(`
          id,
          value,
          host_approved,
          user_id,
          profile:profiles!user_id ( discord_username ),
          question:questions!question_id (
            round,
            attribute:attributes!attribute_id (
              name,
              value,
              sample:samples!sample_id ( label )
            )
          )
        `)
        .eq('fuzzy_flagged', true)
        .is('host_approved', null)
        .in('question_id', qIds)
    : { data: [] };

  return (
    <div className="min-h-screen">
      <Nav
        profile={profile}
        backHref={`/blinds/${blindId}`}
        backLabel="Lobby"
      />
      <HostDashboard
        blind={blind as any}
        fuzzyAnswers={fuzzyAnswers as any ?? []}
        allAnswers={allAnswers as any ?? []}
        ranked={ranked}
        currentUserId={user.id}
      />
    </div>
  );
}
