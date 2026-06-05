import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DestructiveButton } from '@/components/admin/DestructiveButton';
import { deleteSample, resetUserSample } from '../../actions';

export default async function AdminBlindPage({
  params,
}: {
  params: Promise<{ blindId: string }>;
}) {
  const { blindId } = await params;
  const supabase = await createClient();

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

  const [{ data: reveals }, { data: nosings }] = await Promise.all([
    sampleIds.length > 0
      ? supabase.from('sample_reveals').select('sample_id, user_id').in('sample_id', sampleIds)
      : Promise.resolve({ data: [] }),
    sampleIds.length > 0
      ? supabase.from('sample_nosing_submissions').select('sample_id, user_id').in('sample_id', sampleIds)
      : Promise.resolve({ data: [] }),
  ]);

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
    </div>
  );
}
