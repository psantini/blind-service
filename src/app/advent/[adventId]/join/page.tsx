import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Nav } from '@/components/ui/Nav';
import { DiscordLoginButton } from '@/components/auth/DiscordLoginButton';
import { DevLoginPanel } from '@/components/auth/DevLoginPanel';
import { ContributorSubmissionForm } from '@/components/advent/ContributorSubmissionForm';

export default async function AdventJoinPage({
  params,
}: {
  params: Promise<{ adventId: string }>;
}) {
  const { adventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminClient = createAdminClient();

  const { data: advent } = await adminClient
    .from('advent_calendars')
    .select('id, status, blind_id, question_templates')
    .eq('id', adventId)
    .single();

  if (!advent) redirect('/dashboard');

  const { data: blind } = await adminClient
    .from('blinds')
    .select('id, name')
    .eq('id', advent.blind_id)
    .single();

  // Not logged in — show login prompt
  if (!user) {
    return (
      <div className="min-h-screen">
        <Nav profile={null} />
        <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl font-display italic font-bold text-parchment">{blind?.name ?? 'Advent Calendar'}</h1>
          <p className="text-smoke text-sm">You need to log in to submit your bottles.</p>
          <div className="flex justify-center pt-2">
            <DiscordLoginButton next={`/advent/${adventId}/join`} />
          </div>
          {process.env.NODE_ENV === 'development' && (
            <DevLoginPanel redirectTo={`/advent/${adventId}/join`} />
          )}
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  // Submissions closed
  if (advent.status !== 'collecting') {
    return (
      <div className="min-h-screen">
        <Nav profile={profile} backHref="/dashboard" backLabel="Dashboard" />
        <div className="max-w-md mx-auto px-4 py-16 text-center space-y-2">
          <h1 className="text-2xl font-display italic font-bold text-parchment">{blind?.name ?? 'Advent Calendar'}</h1>
          <p className="text-smoke text-sm">The submission window is closed.</p>
        </div>
      </div>
    );
  }

  const { data: manifestRow } = await adminClient
    .from('advent_contributor_manifest')
    .select('id, bottles_expected, has_submitted')
    .eq('advent_calendar_id', adventId)
    .eq('user_id', user.id)
    .single();

  // Not on the list
  if (!manifestRow) {
    return (
      <div className="min-h-screen">
        <Nav profile={profile} backHref="/dashboard" backLabel="Dashboard" />
        <div className="max-w-md mx-auto px-4 py-16 text-center space-y-2">
          <h1 className="text-2xl font-display italic font-bold text-parchment">{blind?.name ?? 'Advent Calendar'}</h1>
          <p className="text-smoke text-sm">Your account isn&apos;t on the contributor list for this calendar.</p>
        </div>
      </div>
    );
  }

  // Already submitted — show confirmation with their assigned letters + photos
  if (manifestRow.has_submitted) {
    const { data: assignments } = await adminClient
      .from('advent_assignments')
      .select('letter, sample:samples!sample_id(bottle_image_url)')
      .eq('advent_calendar_id', adventId)
      .eq('contributor_user_id', user.id)
      .order('letter');

    return (
      <div className="min-h-screen">
        <Nav profile={profile} backHref="/dashboard" backLabel="Dashboard" />
        <div className="max-w-md mx-auto px-4 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-display italic font-bold text-parchment mb-1">{blind?.name ?? 'Advent Calendar'}</h1>
            <p className="text-smoke text-sm">You&apos;ve already submitted. Label your bottles:</p>
          </div>
          <div className="space-y-3">
            {(assignments ?? []).map((a: any) => (
              <div key={a.letter} className="bg-cream rounded-xl p-4 flex items-center gap-5" style={{ border: '0.5px solid #E5DDD0' }}>
                <span className="text-5xl font-display font-bold text-[#0D0D0D] w-12 text-center">{a.letter}</span>
                {a.sample?.bottle_image_url && (
                  <img src={a.sample.bottle_image_url} alt={`Bottle ${a.letter}`} className="h-28 w-auto rounded object-contain" style={{ border: '0.5px solid #E5DDD0' }} />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-[#666]">The blind will be set up automatically once everyone has submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Nav profile={profile} backHref="/dashboard" backLabel="Dashboard" />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-display italic font-bold text-parchment mb-1">{blind?.name ?? 'Advent Calendar'}</h1>
        <p className="text-smoke text-sm mb-8">
          Fill in the details for each of your {manifestRow.bottles_expected} bottle{manifestRow.bottles_expected !== 1 ? 's' : ''}, then upload a photo of each one.
        </p>
        <ContributorSubmissionForm
          adventId={adventId}
          blindId={advent.blind_id}
          bottlesExpected={manifestRow.bottles_expected}
          questionTemplates={advent.question_templates as any[]}
        />
      </div>
    </div>
  );
}
