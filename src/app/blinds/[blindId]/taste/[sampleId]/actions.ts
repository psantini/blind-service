'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { scoreSampleAnswers } from '@/lib/scoring';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';

async function sampleAttributeIds(supabase: SupabaseClient, sampleId: string): Promise<string[]> {
  const { data } = await supabase.from('attributes').select('id').eq('sample_id', sampleId);
  return (data ?? []).map(a => a.id);
}

async function noseQuestionIds(supabase: SupabaseClient, sampleId: string): Promise<string[]> {
  const attrIds = await sampleAttributeIds(supabase, sampleId);
  if (attrIds.length === 0) return [];
  const { data } = await supabase.from('questions').select('id').in('attribute_id', attrIds).eq('round', 'nose');
  return (data ?? []).map(q => q.id);
}

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

  // Lock nose-round answers
  await supabase
    .from('answers')
    .update({ submitted_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('submitted_at', null)
    .in('question_id', await noseQuestionIds(supabase, sampleId));

  // Record nosing submission
  await supabase
    .from('sample_nosing_submissions')
    .upsert({ sample_id: sampleId, user_id: user.id }, { onConflict: 'sample_id,user_id', ignoreDuplicates: true });

  // Score nose answers
  await scoreSampleAnswers(createAdminClient(), sampleId, user.id);

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

  // Lock all remaining unsubmitted answers for this sample
  const attrIds = await sampleAttributeIds(supabase, sampleId);
  const { data: questionRows } = await supabase
    .from('questions')
    .select('id')
    .in('attribute_id', attrIds);
  const questionIds = (questionRows ?? []).map(q => q.id);

  if (questionIds.length > 0) {
    await supabase
      .from('answers')
      .update({ submitted_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('submitted_at', null)
      .in('question_id', questionIds);
  }

  // Record the reveal
  await supabase
    .from('sample_reveals')
    .upsert({ sample_id: sampleId, user_id: user.id }, { onConflict: 'sample_id,user_id', ignoreDuplicates: true });

  // Score all taste answers (and any nose answers not yet scored)
  await scoreSampleAnswers(createAdminClient(), sampleId, user.id);

  revalidatePath(`/blinds/${blindId}/taste/${sampleId}`);
}
