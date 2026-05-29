'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function initAnswers(questionIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase
    .from('answers')
    .upsert(
      questionIds.map(qId => ({
        question_id: qId,
        user_id: user.id,
        value: null,
        submitted_at: null,
      })),
      { onConflict: 'question_id,user_id', ignoreDuplicates: true }
    );
}

export async function saveAnswerDraft(questionId: string, value: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Upsert by (question_id, user_id) so this works even before initAnswers
  // has resolved and returned IDs to the client.
  await supabase
    .from('answers')
    .upsert(
      { question_id: questionId, user_id: user.id, value, submitted_at: null },
      { onConflict: 'question_id,user_id', ignoreDuplicates: false }
    )
    .eq('user_id', user.id)
    .is('submitted_at', null);
}

export async function submitNosing(blindId: string, sampleId: string): Promise<{ redirectTo: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.rpc('submit_nosing', {
    p_sample_id: sampleId,
    p_user_id: user.id,
  });
  if (error) throw error;

  const { data: blind } = await supabase
    .from('blinds')
    .select('round_order, samples(id, display_order)')
    .eq('id', blindId)
    .single();

  const samples = [...((blind?.samples as { id: string; display_order: number }[]) ?? [])]
    .sort((a, b) => a.display_order - b.display_order);

  const roundOrder = blind?.round_order ?? 'interleaved';

  if (roundOrder === 'interleaved') {
    return { redirectTo: `/blinds/${blindId}/taste/${sampleId}` };
  }

  // all_nose_first: find next unnosed sample after current one
  const { data: nosedRows } = await supabase
    .from('sample_nosing_submissions')
    .select('sample_id')
    .eq('user_id', user.id)
    .in('sample_id', samples.map(s => s.id));

  const nosedIds = new Set((nosedRows ?? []).map(n => n.sample_id));
  const currentIdx = samples.findIndex(s => s.id === sampleId);
  const nextUnnosed = samples.find((s, i) => i > currentIdx && !nosedIds.has(s.id));

  if (nextUnnosed) {
    return { redirectTo: `/blinds/${blindId}/taste/${nextUnnosed.id}` };
  }

  // All nosed — start tasting from the first unrevealed sample
  const { data: revealRows } = await supabase
    .from('sample_reveals')
    .select('sample_id')
    .eq('user_id', user.id)
    .in('sample_id', samples.map(s => s.id));

  const revealedIds = new Set((revealRows ?? []).map(r => r.sample_id));
  const firstUntasted = samples.find(s => !revealedIds.has(s.id));

  return { redirectTo: firstUntasted
    ? `/blinds/${blindId}/taste/${firstUntasted.id}`
    : `/blinds/${blindId}` };
}

export async function submitSample(blindId: string, sampleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.rpc('submit_sample', {
    p_sample_id: sampleId,
    p_user_id: user.id,
  });

  if (error) throw error;

  revalidatePath(`/blinds/${blindId}/taste/${sampleId}`);
}
