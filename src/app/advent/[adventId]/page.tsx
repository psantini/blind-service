import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Nav } from '@/components/ui/Nav';
import { AdventInviteLink } from '@/components/advent/AdventInviteLink';
import { SampleSetupForm } from '@/components/blind/SampleSetupForm';

export default async function AdventDashboardPage({
  params,
}: {
  params: Promise<{ adventId: string }>;
}) {
  const { adventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const adminClient = createAdminClient();

  const { data: advent } = await adminClient
    .from('advent_calendars')
    .select('id, status, blind_id')
    .eq('id', adventId)
    .single();

  if (!advent) redirect('/dashboard');

  const { data: blind } = await adminClient
    .from('blinds')
    .select('id, name, host_id, nosing_enabled')
    .eq('id', advent.blind_id)
    .single();

  if (!blind || blind.host_id !== user.id) redirect('/dashboard');

  if (advent.status === 'complete') redirect(`/blinds/${advent.blind_id}`);

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: manifest } = await adminClient
    .from('advent_contributor_manifest')
    .select('user_id, bottles_expected, has_submitted, profile:profiles!user_id(discord_username)')
    .eq('advent_calendar_id', adventId)
    .order('user_id');

  const rows = (manifest ?? []) as unknown as Array<{
    user_id: string;
    bottles_expected: number;
    has_submitted: boolean;
    profile: { discord_username: string } | null;
  }>;

  const totalBottles = rows.reduce((sum, r) => sum + r.bottles_expected, 0);
  const submittedBottles = rows.filter(r => r.has_submitted).reduce((sum, r) => sum + r.bottles_expected, 0);

  // ── Collecting: show invite link + submission progress ─────────────────────
  if (advent.status === 'collecting') {
    return (
      <div className="min-h-screen">
        <Nav profile={profile} backHref="/dashboard" backLabel="Dashboard" />
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
          <div>
            <h1 className="text-2xl font-display italic font-bold text-parchment mb-1">{blind.name}</h1>
            <p className="text-smoke text-sm">Collecting submissions — share the invite link with your contributors.</p>
          </div>

          <AdventInviteLink path={`/advent/${adventId}/join`} />

          <div className="bg-cream rounded-xl p-6 space-y-4" style={{ border: '0.5px solid #E5DDD0' }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#666] uppercase tracking-wider">Submission progress</p>
              <span className={`text-sm font-semibold ${submittedBottles === totalBottles ? 'text-green-600' : 'text-amber'}`}>
                {submittedBottles} / {totalBottles} bottles
              </span>
            </div>
            <div className="divide-y divide-[#E5DDD0]">
              {rows.map(row => (
                <div key={row.user_id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-[#0D0D0D]">{row.profile?.discord_username ?? row.user_id}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#999]">
                      {row.bottles_expected} bottle{row.bottles_expected !== 1 ? 's' : ''}
                    </span>
                    {row.has_submitted
                      ? <span className="text-xs font-medium text-green-600">Submitted</span>
                      : <span className="text-xs text-[#999]">Pending</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Host setup: day→letter mapping + bonus sample editor ──────────────────
  const { data: assignments } = await adminClient
    .from('advent_assignments')
    .select('letter, day, sample_id')
    .eq('advent_calendar_id', adventId)
    .order('day');

  const assignmentRows = (assignments ?? []) as Array<{ letter: string; day: number; sample_id: string }>;
  const adventSampleIds = new Set(assignmentRows.map(a => a.sample_id));

  // Fetch all samples for this blind, then keep only ones the host added (not from contributors)
  const { data: allSamples } = await adminClient
    .from('samples')
    .select(`
      id, label, display_order, bottle_image_url,
      attributes ( id, name, value, input_type, scoring_type, brackets, questions ( id, round ) )
    `)
    .eq('blind_id', advent.blind_id)
    .order('display_order');

  const bonusSamples = (allSamples ?? []).filter((s: any) => !adventSampleIds.has(s.id));

  return (
    <div className="min-h-screen">
      <Nav profile={profile} backHref="/dashboard" backLabel="Dashboard" />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-display italic font-bold text-parchment mb-1">{blind.name}</h1>
          <p className="text-smoke text-sm">All bottles submitted. Open each bottle on the assigned day.</p>
        </div>

        <div className="bg-cream rounded-xl p-6" style={{ border: '0.5px solid #E5DDD0' }}>
          <p className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-4">Day assignments</p>
          <div className="grid grid-cols-2 gap-x-8">
            {[assignmentRows.slice(0, 12), assignmentRows.slice(12)].map((col, ci) => (
              <div key={ci}>
                {col.map(a => (
                  <div key={a.day} className="flex items-center justify-between py-2 border-b border-[#E5DDD0]">
                    <span className="text-sm text-[#0D0D0D]">Day {a.day}</span>
                    <span className="text-base font-display font-bold text-[#0D0D0D]">Bottle {a.letter}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-1">Bonus samples</p>
          <p className="text-xs text-[#999] mb-6">Add any extra samples (e.g. day 25). When you&apos;re ready, activate the blind below.</p>
          <SampleSetupForm
            blindId={advent.blind_id}
            nosingEnabled={blind.nosing_enabled ?? false}
            blindStatus="setup"
            initialSamples={bonusSamples as any}
          />
        </div>
      </div>
    </div>
  );
}
