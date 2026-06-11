'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

async function assertSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: profile } = await supabase.from('profiles').select('is_super_admin').eq('id', user.id).single();
  if (!profile?.is_super_admin) throw new Error('Forbidden');
  return user.id;
}

async function assertGroupManager(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase.from('profiles').select('is_super_admin').eq('id', user.id).single();
  if (profile?.is_super_admin) return user.id;

  const adminClient = createAdminClient();
  const { data: membership } = await adminClient
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single();

  if (membership?.role !== 'admin') throw new Error('Forbidden');
  return user.id;
}

export async function createGroup(formData: FormData) {
  await assertSuperAdmin();
  const name = (formData.get('name') as string)?.trim();
  const discordGuildId = (formData.get('discord_guild_id') as string)?.trim() || null;
  if (!name) throw new Error('Name is required');

  const adminClient = createAdminClient();
  const { error } = await adminClient.from('groups').insert({ name, discord_guild_id: discordGuildId });
  if (error) throw error;
  revalidatePath('/groups');
}

export async function deleteGroup(groupId: string) {
  await assertSuperAdmin();
  const adminClient = createAdminClient();
  const { error } = await adminClient.from('groups').delete().eq('id', groupId);
  if (error) throw error;
  revalidatePath('/groups');
}

export async function createInvite(formData: FormData) {
  const groupId = formData.get('group_id') as string;
  const createdBy = await assertGroupManager(groupId);
  const expiresDays = parseInt(formData.get('expires_days') as string, 10) || 7;
  const maxUsesRaw = (formData.get('max_uses') as string)?.trim();
  const maxUses = maxUsesRaw ? parseInt(maxUsesRaw, 10) : null;

  const expiresAt = new Date(Date.now() + expiresDays * 86_400_000).toISOString();

  const adminClient = createAdminClient();
  const { error } = await adminClient.from('group_invites').insert({
    group_id: groupId,
    created_by: createdBy,
    max_uses: maxUses,
    expires_at: expiresAt,
  });
  if (error) throw error;
  revalidatePath('/groups');
}

export async function revokeInvite(groupId: string, inviteId: string) {
  await assertGroupManager(groupId);
  const adminClient = createAdminClient();
  const { error } = await adminClient.from('group_invites').delete().eq('id', inviteId);
  if (error) throw error;
  revalidatePath('/groups');
}

export async function addMember(formData: FormData) {
  const groupId = formData.get('group_id') as string;
  await assertGroupManager(groupId);
  const userId = formData.get('user_id') as string;
  if (!userId) throw new Error('User is required');

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('group_members')
    .upsert({ group_id: groupId, user_id: userId }, { onConflict: 'group_id,user_id', ignoreDuplicates: true });
  if (error) throw error;
  revalidatePath('/groups');
}

export async function removeMember(groupId: string, userId: string) {
  await assertGroupManager(groupId);
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) throw error;
  revalidatePath('/groups');
}

export async function updateMemberRole(groupId: string, userId: string, role: 'admin' | 'member') {
  await assertGroupManager(groupId);
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('group_members')
    .update({ role })
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) throw error;
  revalidatePath('/groups');
}
