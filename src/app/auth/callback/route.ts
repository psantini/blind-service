import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function fetchDiscordGuilds(providerToken: string | null | undefined): Promise<string[]> {
  if (!providerToken) return [];
  try {
    const res = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${providerToken}` },
    });
    if (!res.ok) return [];
    const guilds: Array<{ id: string }> = await res.json();
    return guilds.map(g => g.id);
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session) {
      const adminClient = createAdminClient();
      const provider = session.user.app_metadata?.provider;

      if (provider === 'discord') {
        const userGuildIds = await fetchDiscordGuilds(session.provider_token);

        // Find all groups linked to a Discord guild
        const { data: discordLinkedGroups } = await adminClient
          .from('groups')
          .select('id, discord_guild_id')
          .not('discord_guild_id', 'is', null);

        const linkedGroups = discordLinkedGroups ?? [];

        if (linkedGroups.length > 0) {
          const matchingGroupIds = linkedGroups
            .filter(g => userGuildIds.includes(g.discord_guild_id!))
            .map(g => g.id);

          const nonMatchingGroupIds = linkedGroups
            .filter(g => !userGuildIds.includes(g.discord_guild_id!))
            .map(g => g.id);

          // Add user to groups they're in
          if (matchingGroupIds.length > 0) {
            await adminClient
              .from('group_members')
              .upsert(
                matchingGroupIds.map(groupId => ({ group_id: groupId, user_id: session.user.id })),
                { onConflict: 'group_id,user_id', ignoreDuplicates: true }
              );
          }

          // Remove user from Discord-linked groups they've left
          if (nonMatchingGroupIds.length > 0) {
            await adminClient
              .from('group_members')
              .delete()
              .eq('user_id', session.user.id)
              .in('group_id', nonMatchingGroupIds);
          }

          if (matchingGroupIds.length === 0) {
            await supabase.auth.signOut();
            return NextResponse.redirect(`${origin}/?error=not_authorized`);
          }
        }
        // No Discord-linked groups registered → open access for all Discord users

      } else {
        // Google or other provider: gate on existing group membership
        // Exception: allow through if they're redeeming an invite on /join
        const { data: memberships } = await adminClient
          .from('group_members')
          .select('group_id')
          .eq('user_id', session.user.id)
          .limit(1);

        const hasMembership = (memberships ?? []).length > 0;
        const isJoiningViaInvite = next.startsWith('/join');

        if (!hasMembership && !isJoiningViaInvite) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/?error=not_authorized`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
