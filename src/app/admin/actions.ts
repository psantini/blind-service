'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function assertSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: profile } = await supabase.from('profiles').select('is_super_admin').eq('id', user.id).single();
  if (!profile?.is_super_admin) throw new Error('Forbidden');
  return supabase;
}

export async function deleteBlind(blindId: string) {
  const supabase = await assertSuperAdmin();
  const { error } = await supabase.from('blinds').delete().eq('id', blindId);
  if (error) throw error;
  revalidatePath('/admin');
}

export async function deleteSample(blindId: string, sampleId: string) {
  const supabase = await assertSuperAdmin();
  const { error } = await supabase.from('samples').delete().eq('id', sampleId);
  if (error) throw error;
  revalidatePath(`/admin/blinds/${blindId}`);
}

export async function resetUserSample(blindId: string, sampleId: string, userId: string) {
  const supabase = await assertSuperAdmin();

  // Gather all question IDs for this sample so we can delete the user's answers
  const { data: attrs } = await supabase
    .from('attributes')
    .select('id')
    .eq('sample_id', sampleId);

  const attrIds = (attrs ?? []).map(a => a.id);

  if (attrIds.length > 0) {
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .in('attribute_id', attrIds);

    const questionIds = (questions ?? []).map(q => q.id);

    if (questionIds.length > 0) {
      const { error } = await supabase
        .from('answers')
        .delete()
        .eq('user_id', userId)
        .in('question_id', questionIds);
      if (error) throw error;
    }
  }

  await supabase.from('sample_reveals').delete().eq('sample_id', sampleId).eq('user_id', userId);
  await supabase.from('sample_nosing_submissions').delete().eq('sample_id', sampleId).eq('user_id', userId);

  revalidatePath(`/admin/blinds/${blindId}`);
}
