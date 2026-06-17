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

  const samples = [...(blind.samples as any[])].sort((a: any, b: any) => a.display_order - b.display_order);
  const sampleIds = samples.map((s: any) => s.id as string);

  // Fetch attributes and questions
  const { data: attributeRows } = sampleIds.length > 0
    ? await supabase.from('attributes').select('id, name, value, sample_id').in('sample_id', sampleIds)
    : { data: [] };

  const attrIds = (attributeRows ?? []).map((a: any) => a.id);

  const { data: questionRows } = attrIds.length > 0
    ? await supabase.from('questions').select('id, round, attribute_id').in('attribute_id', attrIds)
    : { data: [] };

  const qIds = (questionRows ?? []).map((q: any) => q.id);

  // All submitted answers
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

  // Fuzzy review items
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

  // Compute live standings
  const questionRoundMap = Object.fromEntries(
    (questionRows ?? []).map((q: any) => [q.id, q.round])
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

  // Build sample breakdown for SampleBreakdown component
  const sampleBreakdowns = samples.map((s: any) => {
    const attrs = (attributeRows ?? []).filter((a: any) => a.sample_id === s.id);
    const attributes = attrs.map((attr: any) => {
      const q = (questionRows ?? []).find((q: any) => q.attribute_id === attr.id);
      return {
        questionId: q?.id ?? '',
        attrId: attr.id,
        name: attr.name,
        correctValue: attr.value,
        round: (q?.round ?? 'taste') as 'nose' | 'taste',
      };
    }).filter((a: any) => a.questionId);
    return { id: s.id, label: s.label, attributes };
  });

  // answerMap[userId][questionId]
  const answerMap: Record<string, Record<string, { value: string | null; points: number | null; fuzzyPending: boolean }>> = {};
  for (const a of (allAnswers ?? []) as any[]) {
    if (!answerMap[a.user_id]) answerMap[a.user_id] = {};
    answerMap[a.user_id][a.question_id] = {
      value: a.value,
      points: a.points_earned,
      fuzzyPending: a.fuzzy_flagged && a.host_approved === null,
    };
  }

  const players = ranked.map(r => ({ id: r.profile.id, discord_username: r.profile.discord_username }));

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
        sampleBreakdowns={sampleBreakdowns}
        answerMap={answerMap}
        players={players}
      />
    </div>
  );
}
