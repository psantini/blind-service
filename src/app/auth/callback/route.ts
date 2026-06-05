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

      // Fetch the user's Discord server memberships
      const userGuildIds = await fetchDiscordGuilds(session.provider_token);

      // Check against registered guilds. If none are registered yet, allow all.
      const { data: registeredGuilds } = await adminClient
        .from('guilds')
        .select('discord_guild_id');

      const registeredIds = (registeredGuilds ?? []).map(g => g.discord_guild_id);
      const hasAccess = registeredIds.length === 0 ||
        userGuildIds.some(id => registeredIds.includes(id));

      if (!hasAccess) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/?error=not_authorized`);
      }

      // Cache guild memberships on the profile for RLS checks
      await adminClient
        .from('profiles')
        .update({ discord_guild_ids: userGuildIds })
        .eq('id', session.user.id);

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
