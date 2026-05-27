'use server';

import { createClient } from '@/lib/supabase/server';

export async function joinBlind(blindId: string): Promise<{ redirectTo: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { redirectTo: '/' };

  await supabase
    .from('blind_members')
    .upsert(
      {
        blind_id: blindId,
        user_id: user.id,
        role: 'participant',
      },
      { onConflict: 'blind_id,user_id', ignoreDuplicates: true }
    );

  const { data: samples } = await supabase
    .from('samples')
    .select('id, display_order')
    .eq('blind_id', blindId)
    .order('display_order')
    .limit(1);

  if (samples && samples.length > 0) {
    return { redirectTo: `/blinds/${blindId}/taste/${samples[0].id}` };
  }
  return { redirectTo: `/blinds/${blindId}` };
}
