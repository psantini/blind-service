import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Nav } from '@/components/ui/Nav';
import { QuestionSheet } from '@/components/tasting/QuestionSheet';
import { RevealCard } from '@/components/blind/RevealCard';
import { FlightProgressBar } from '@/components/tasting/FlightProgressBar';

export default async function TastingPage({
  params,
}: {
  params: Promise<{ blindId: string; sampleId: string }>;
}) {
  const { blindId, sampleId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get blind info
  const { data: blind } = await supabase
    .from('blinds')
    .select('id, name, nosing_enabled, status')
    .eq('id', blindId)
    .single();

  if (!blind) redirect('/dashboard');

  // Get all samples for flight progress
  const { data: allSamples } = await supabase
    .from('samples')
    .select('id, label, display_order')
    .eq('blind_id', blindId)
    .order('display_order');

  // Get current sample
  const { data: sample } = await supabase
    .from('samples')
    .select('id, label, display_order, bottle_image_url')
    .eq('id', sampleId)
    .single();

  if (!sample) redirect(`/blinds/${blindId}`);

  // Check if user has revealed this sample
  const { data: reveal } = await supabase
    .from('sample_reveals')
    .select('id, revealed_at')
    .eq('sample_id', sampleId)
    .eq('user_id', user.id)
    .single();

  const hasRevealed = !!reveal;

  // Get reveals for all samples (for flight progress bar)
  const { data: allReveals } = await supabase
    .from('sample_reveals')
    .select('sample_id')
    .eq('user_id', user.id)
    .in('sample_id', allSamples?.map(s => s.id) ?? []);

  const revealedSampleIds = new Set(allReveals?.map(r => r.sample_id) ?? []);

  if (hasRevealed) {
    // Post-reveal: show reveal screen
    const { data: attributes } = await supabase
      .from('attributes')
      .select('id, name, value, input_type, scoring_type')
      .eq('sample_id', sampleId);

    const { data: questions } = await supabase
      .from('questions')
      .select(`
        id,
        round,
        attribute:attributes!attribute_id ( id, name, input_type, scoring_type )
      `)
      .in('attribute_id', attributes?.map(a => a.id) ?? []);

    const questionIds = questions?.map(q => q.id) ?? [];

    const { data: allAnswers } = questionIds.length > 0
      ? await supabase
          .from('answers')
          .select(`
            id,
            value,
            points_earned,
            fuzzy_flagged,
            host_approved,
            user_id,
            question_id,
            profile:profiles!user_id (
              id,
              discord_username,
              discord_avatar_url
            )
          `)
          .in('question_id', questionIds)
      : { data: [] };

    const sortedSamples = [...(allSamples ?? [])].sort((a, b) => a.display_order - b.display_order);
    const currentIdx = sortedSamples.findIndex(s => s.id === sampleId);
    const nextSample = sortedSamples[currentIdx + 1] ?? null;

    return (
      <div className="min-h-screen bg-stone-50">
        <Nav profile={profile} backHref={`/blinds/${blindId}`} backLabel="Lobby" />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <FlightProgressBar
            samples={sortedSamples}
            currentSampleId={sampleId}
            revealedSampleIds={revealedSampleIds}
          />
          <RevealCard
            blindId={blindId}
            sample={sample}
            attributes={attributes as any ?? []}
            questions={questions as any ?? []}
            allAnswers={allAnswers as any ?? []}
            currentUserId={user.id}
            nextSample={nextSample}
          />
        </div>
      </div>
    );
  }

  // Pre-reveal: show question sheet
  const { data: questions } = await supabase
    .from('questions')
    .select(`
      id,
      round,
      attribute:attributes!attribute_id (
        id,
        name,
        input_type,
        scoring_type,
        brackets
      )
    `)
    .filter('attribute.sample_id', 'eq', sampleId);

  const validQuestions = (questions ?? []).filter((q: any) => q.attribute);

  // Init answer rows if needed
  const questionIds = validQuestions.map((q: any) => q.id);

  const { data: existingAnswers } = questionIds.length > 0
    ? await supabase
        .from('answers')
        .select('id, question_id, value, submitted_at')
        .eq('user_id', user.id)
        .in('question_id', questionIds)
    : { data: [] };

  const sortedSamples = [...(allSamples ?? [])].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav profile={profile} backHref={`/blinds/${blindId}`} backLabel="Lobby" />
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="mb-1">
          <p className="text-xs text-stone-400">{blind.name}</p>
          <h1 className="text-2xl font-bold text-stone-900">Sample {sample.label}</h1>
        </div>
        <p className="text-sm text-stone-500 mb-4">
          Answer all questions below, then submit to reveal and move on.
        </p>

        <FlightProgressBar
          samples={sortedSamples}
          currentSampleId={sampleId}
          revealedSampleIds={revealedSampleIds}
        />

        {blind.nosing_enabled && (
          <div className="mt-4 mb-2">
            <span className="inline-block px-2.5 py-1 bg-stone-100 text-stone-600 text-xs font-medium rounded-full">
              Tasting round
            </span>
          </div>
        )}

        <QuestionSheet
          blindId={blindId}
          sampleId={sampleId}
          sampleLabel={sample.label}
          questions={validQuestions as any}
          existingAnswers={existingAnswers as any ?? []}
          nextSampleLabel={sortedSamples[sortedSamples.findIndex(s => s.id === sampleId) + 1]?.label}
        />
      </div>
    </div>
  );
}
