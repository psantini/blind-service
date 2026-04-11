'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createBlind(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const name = (formData.get('name') as string)?.trim();
  if (!name) throw new Error('Blind name is required');

  const nosingEnabled = formData.get('nosing_enabled') === 'true';

  const { data: blind, error: blindError } = await supabase
    .from('blinds')
    .insert({
      name,
      host_id: user.id,
      nosing_enabled: nosingEnabled,
      status: 'setup',
    })
    .select('id')
    .single();

  if (blindError || !blind) throw blindError;

  await supabase
    .from('blind_members')
    .insert({
      blind_id: blind.id,
      user_id: user.id,
      role: 'host',
    });

  redirect(`/blinds/${blind.id}/host/setup`);
}
