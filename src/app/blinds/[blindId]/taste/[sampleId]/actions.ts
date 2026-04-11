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

export async function saveAnswerDraft(answerId: string, value: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase
    .from('answers')
    .update({ value })
    .eq('id', answerId)
    .eq('user_id', user.id)
    .is('submitted_at', null);
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
