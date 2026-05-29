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

  const { data: blind } = await supabase
    .from('blinds')
    .select('id, name, nosing_enabled, status, round_order')
    .eq('id', blindId)
    .single();

  if (!blind) redirect('/dashboard');

  const { data: allSamples } = await supabase
    .from('samples')
    .select('id, label, display_order')
    .eq('blind_id', blindId)
    .order('display_order');

  const { data: sample } = await supabase
    .from('samples')
    .select('id, label, display_order, bottle_image_url')
    .eq('id', sampleId)
    .single();

  if (!sample) redirect(`/blinds/${blindId}`);

  const { data: reveal } = await supabase
    .from('sample_reveals')
    .select('id, revealed_at')
    .eq('sample_id', sampleId)
    .eq('user_id', user.id)
    .single();

  const hasRevealed = !!reveal;

  const sampleIdList = allSamples?.map(s => s.id) ?? [];

  const { data: allReveals } = await supabase
    .from('sample_reveals')
    .select('sample_id')
    .eq('user_id', user.id)
    .in('sample_id', sampleIdList);

  const revealedSampleIds = new Set((allReveals ?? []).map(r => r.sample_id));

  // Fetch nosing submissions for progress bar and phase detection
  const { data: allNosings } = blind.nosing_enabled && sampleIdList.length > 0
    ? await supabase
        .from('sample_nosing_submissions')
        .select('sample_id')
        .eq('user_id', user.id)
        .in('sample_id', sampleIdList)
    : { data: [] };

  const nosedSampleIds = new Set((allNosings ?? []).map(n => n.sample_id));
  const hasNosed = nosedSampleIds.has(sampleId);

  const sortedSamples = [...(allSamples ?? [])].sort((a, b) => a.display_order - b.display_order);

  if (hasRevealed) {
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

    const currentIdx = sortedSamples.findIndex(s => s.id === sampleId);
    const nextSample = sortedSamples[currentIdx + 1] ?? null;

    return (
      <div className="min-h-screen">
        <Nav profile={profile} backHref={`/blinds/${blindId}`} backLabel="Lobby" />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <FlightProgressBar
            samples={sortedSamples}
            currentSampleId={sampleId}
            revealedSampleIds={revealedSampleIds}
            nosedSampleIds={nosedSampleIds}
            nosingEnabled={blind.nosing_enabled}
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

  // Pre-reveal: fetch attributes then questions, filter by current phase
  const { data: sampleAttributes } = await supabase
    .from('attributes')
    .select('id, name, input_type, scoring_type, brackets')
    .eq('sample_id', sampleId);

  const attrIds = sampleAttributes?.map(a => a.id) ?? [];

  const { data: rawQuestions } = attrIds.length > 0
    ? await supabase
        .from('questions')
        .select('id, round, attribute_id')
        .in('attribute_id', attrIds)
    : { data: [] };

  const allValidQuestions = (rawQuestions ?? []).map((q: any) => ({
    id: q.id,
    round: q.round,
    attribute: sampleAttributes?.find(a => a.id === q.attribute_id) ?? null,
  })).filter((q: any) => q.attribute);

  // Determine phase
  const hasNoseQuestions = allValidQuestions.some(q => q.round === 'nose');
  const phase: 'nose' | 'taste' =
    blind.nosing_enabled && hasNoseQuestions && !hasNosed ? 'nose' : 'taste';

  const validQuestions = blind.nosing_enabled
    ? allValidQuestions.filter(q => q.round === phase)
    : allValidQuestions;

  const questionIds = validQuestions.map((q: any) => q.id);

  const { data: existingAnswers } = questionIds.length > 0
    ? await supabase
        .from('answers')
        .select('id, question_id, value, submitted_at')
        .eq('user_id', user.id)
        .in('question_id', questionIds)
    : { data: [] };

  const currentIdx = sortedSamples.findIndex(s => s.id === sampleId);
  const nextSample = sortedSamples[currentIdx + 1] ?? null;

  return (
    <div className="min-h-screen">
      <Nav profile={profile} backHref={`/blinds/${blindId}`} backLabel="Lobby" />
      <div className="max-w-xl mx-auto px-4 py-6">
        <FlightProgressBar
          samples={sortedSamples}
          currentSampleId={sampleId}
          revealedSampleIds={revealedSampleIds}
          nosedSampleIds={nosedSampleIds}
          nosingEnabled={blind.nosing_enabled}
        />
        <div className="mb-4">
          {blind.nosing_enabled && (
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 ${
              phase === 'nose'
                ? 'bg-amber text-black'
                : 'border border-[#444] text-parchment'
            }`}>
              {phase === 'nose' ? 'Nosing Round' : 'Tasting Round'}
            </span>
          )}
          <p className="text-xs text-muted">{blind.name}</p>
          <h1 className="text-2xl font-display italic font-bold text-parchment">
            Sample {sample.label}
          </h1>
        </div>
        <p className="text-sm text-smoke mb-4">
          Answer all questions below, then submit to {phase === 'nose' ? 'lock in your nose notes' : 'reveal and move on'}.
        </p>
        <QuestionSheet
          blindId={blindId}
          sampleId={sampleId}
          sampleLabel={sample.label}
          questions={validQuestions as any}
          existingAnswers={existingAnswers as any ?? []}
          phase={phase}
          nextSampleLabel={nextSample?.label}
        />
      </div>
    </div>
  );
}
