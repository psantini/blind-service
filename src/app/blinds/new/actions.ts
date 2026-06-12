'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export async function createBlind(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const name = (formData.get('name') as string)?.trim();
  if (!name) throw new Error('Blind name is required');

  const nosingEnabled = formData.get('nosing_enabled') === 'true';
  const roundOrder = formData.get('round_order') as string || 'interleaved';
  const groupId = (formData.get('group_id') as string) || null;

  if (!groupId) throw new Error('A group is required');

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    const { data: membership } = await adminClient
      .from('group_members')
      .select('group_id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();
    if (!membership) throw new Error('Forbidden');
  }

  const { data: blind, error: blindError } = await supabase
    .from('blinds')
    .insert({
      name,
      host_id: user.id,
      nosing_enabled: nosingEnabled,
      round_order: roundOrder,
      status: 'setup',
      group_id: groupId,
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
