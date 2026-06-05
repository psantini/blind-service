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
}

export async function addGuild(formData: FormData) {
  await assertSuperAdmin();
  const discordGuildId = (formData.get('discord_guild_id') as string)?.trim();
  const name = (formData.get('name') as string)?.trim();
  if (!discordGuildId || !name) throw new Error('Discord guild ID and name are required');

  const adminClient = createAdminClient();
  const { error } = await adminClient.from('guilds').insert({ discord_guild_id: discordGuildId, name });
  if (error) throw error;
  revalidatePath('/admin/guilds');
}

export async function deleteGuild(guildId: string) {
  await assertSuperAdmin();
  const adminClient = createAdminClient();
  const { error } = await adminClient.from('guilds').delete().eq('id', guildId);
  if (error) throw error;
  revalidatePath('/admin/guilds');
}
