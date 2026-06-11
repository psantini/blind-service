'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export async function redeemInvite(token: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const adminClient = createAdminClient();

  const { data: invite } = await adminClient
    .from('group_invites')
    .select('id, group_id, max_uses, use_count, expires_at')
    .eq('token', token)
    .single();

  if (!invite) throw new Error('Invalid invite link');
  if (new Date(invite.expires_at) < new Date()) throw new Error('This invite link has expired');
  if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
    throw new Error('This invite link has reached its maximum uses');
  }

  await adminClient
    .from('group_members')
    .upsert(
      { group_id: invite.group_id, user_id: user.id },
      { onConflict: 'group_id,user_id', ignoreDuplicates: true }
    );

  await adminClient
    .from('group_invites')
    .update({ use_count: invite.use_count + 1 })
    .eq('id', invite.id);

  redirect('/dashboard');
}
