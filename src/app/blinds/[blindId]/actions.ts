'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function joinBlind(blindId: string): Promise<{ redirectTo?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { redirectTo: '/' };

  const { error } = await supabase
    .from('blind_members')
    .upsert(
      { blind_id: blindId, user_id: user.id, role: 'participant' },
      { onConflict: 'blind_id,user_id', ignoreDuplicates: true }
    );

  if (error) return { error: `${error.code}: ${error.message}` };

  // samples are now readable by all authenticated users, so this query
  // works regardless of whether the upsert row has propagated yet
  const { data: samples } = await supabase
    .from('samples')
    .select('id, display_order')
    .eq('blind_id', blindId)
    .order('display_order')
    .limit(1);

  revalidatePath(`/blinds/${blindId}`);

  if (samples && samples.length > 0) {
    return { redirectTo: `/blinds/${blindId}/taste/${samples[0].id}` };
  }
  return { redirectTo: `/blinds/${blindId}` };
}
