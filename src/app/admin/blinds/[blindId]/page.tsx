import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { DestructiveButton } from '@/components/admin/DestructiveButton';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { deleteSample, resetUserSample } from '../../actions';

export default async function AdminBlindPage({
  params,
}: {
  params: Promise<{ blindId: string }>;
}) {
  const { blindId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: blind } = await supabase
    .from('blinds')
    .select('id, name, status, nosing_enabled')
    .eq('id', blindId)
    .single();

  if (!blind) redirect('/admin');

  const { data: samples } = await supabase
    .from('samples')
    .select('id, label, display_order')
    .eq('blind_id', blindId)
    .order('display_order');

  const { data: members } = await supabase
    .from('blind_members')
    .select('user_id, role, profile:profiles!user_id(discord_username)')
    .eq('blind_id', blindId);

  const sampleIds = (samples ?? []).map(s => s.id);
  const adminClient = createAdminClient();

  const [{ data: reveals }, { data: nosings }, { data: attributeRows }] = await Promise.all([
    sampleIds.length > 0
      ? supabase.from('sample_reveals').select('sample_id, user_id').in('sample_id', sampleIds)
      : Promise.resolve({ data: [] }),
    sampleIds.length > 0
      ? supabase.from('sample_nosing_submissions').select('sample_id, user_id').in('sample_id', sampleIds)
      : Promise.resolve({ data: [] }),
    sampleIds.length > 0
      ? adminClient.from('attributes').select('id').in('sample_id', sampleIds)
      : Promise.resolve({ data: [] }),
  ]);

  const attrIds = (attributeRows ?? []).map((a: any) => a.id);

  const { data: questionRows } = attrIds.length > 0
    ? await adminClient.from('questions').select('id, round').in('attribute_id', attrIds)
    : { data: [] };

  const questionIds = (questionRows ?? []).map((q: any) => q.id);

  const { data: answers } = questionIds.length > 0
    ? await adminClient
        .from('answers')
        .select('user_id, question_id, points_earned, fuzzy_flagged, host_approved, profile:profiles!user_id(id, discord_username, discord_avatar_url)')
        .in('question_id', questionIds)
        .not('submitted_at', 'is', null)
    : { data: [] };

  const questionRoundMap = Object.fromEntries(
    (questionRows ?? []).map((q: any) => [q.id, q.round])
  );

  const scoreMap: Record<string, { profile: any; total: number; nose: number; taste: number; pending: number }> = {};
  for (const answer of (answers ?? []) as any[]) {
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

  const revealSet = new Set((reveals ?? []).map(r => `${r.sample_id}:${r.user_id}`));
  const nosingSet = new Set((nosings ?? []).map(n => `${n.sample_id}:${n.user_id}`));

  const participants = (members ?? []).filter(m => m.role === 'participant');

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted mb-1">
          <a href="/admin" className="hover:text-parchment">Admin</a>
          {' / '}Blind
        </p>
        <h1 className="text-2xl font-display italic font-bold text-parchment">{blind.name}</h1>
        <p className="text-sm text-muted mt-1">
          {blind.status} · {blind.nosing_enabled ? 'Nose + Taste' : 'Taste only'}
        </p>
      </div>

      <div className="space-y-4">
        {(samples ?? []).map(sample => {
          const sampleParticipants = participants.filter(m => {
            const key = `${sample.id}:${m.user_id}`;
            return revealSet.has(key) || nosingSet.has(key);
          });

          return (
            <div key={sample.id} className="bg-cream rounded-xl overflow-hidden" style={{ border: '0.5px solid #E5DDD0' }}>
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '0.5px solid #E5DDD0' }}>
                <p className="text-sm font-semibold text-[#0D0D0D]">Sample {sample.label}</p>
                <DestructiveButton
                  label="Delete sample"
                  action={deleteSample.bind(null, blindId, sample.id)}
                />
              </div>

              {sampleParticipants.length === 0 ? (
                <p className="px-5 py-3 text-xs text-muted">No submissions yet</p>
              ) : (
                <div className="divide-y divide-[#E5DDD0]">
                  {sampleParticipants.map(m => {
                    const key = `${sample.id}:${m.user_id}`;
                    const hasReveal = revealSet.has(key);
                    const hasNosing = nosingSet.has(key);
                    const profile = m.profile as any;

                    return (
                      <div key={m.user_id} className="flex items-center justify-between px-5 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#E5DDD0] flex items-center justify-center text-xs font-bold text-[#0D0D0D] shrink-0">
                            {profile?.discord_username?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm text-[#0D0D0D]">{profile?.discord_username}</span>
                          <div className="flex gap-1">
                            {hasNosing && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber/20 text-amber">nosed</span>
                            )}
                            {hasReveal && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/40 text-green-400">revealed</span>
                            )}
                          </div>
                        </div>
                        <DestructiveButton
                          label="Reset"
                          confirmLabel="Confirm reset"
                          action={resetUserSample.bind(null, blindId, sample.id, m.user_id)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-parchment mb-3">Leaderboard</h2>
        <Leaderboard
          entries={ranked}
          currentUserId={user?.id ?? ''}
          nosingEnabled={blind.nosing_enabled}
        />
      </div>
    </div>
  );
}
