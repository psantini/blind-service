'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function joinBlind(blindId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

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

  // Get first sample to navigate to tasting
  const { data: samples } = await supabase
    .from('samples')
    .select('id, display_order')
    .eq('blind_id', blindId)
    .order('display_order')
    .limit(1);

  if (samples && samples.length > 0) {
    redirect(`/blinds/${blindId}/taste/${samples[0].id}`);
  } else {
    redirect(`/blinds/${blindId}`);
  }
}
