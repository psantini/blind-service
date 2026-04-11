import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Nav } from '@/components/ui/Nav';
import { BlindLobby } from '@/components/blind/BlindLobby';

export default async function BlindLobbyPage({
  params,
}: {
  params: Promise<{ blindId: string }>;
}) {
  const { blindId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: blind } = await supabase
    .from('blinds')
    .select(`
      id,
      name,
      status,
      nosing_enabled,
      host_id,
      host:profiles!host_id (
        id,
        discord_username,
        discord_avatar_url
      ),
      blind_members (
        user_id,
        role,
        joined_at,
        profile:profiles!user_id (
          id,
          discord_username,
          discord_avatar_url
        )
      ),
      samples (
        id,
        label,
        display_order
      )
    `)
    .eq('id', blindId)
    .single();

  if (!blind) redirect('/dashboard');

  const currentMember = blind.blind_members.find((m: any) => m.user_id === user.id);
  const isHost = currentMember?.role === 'host';
  const firstSample = (blind.samples as any[]).sort((a, b) => a.display_order - b.display_order)[0];

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav profile={profile} backHref="/dashboard" backLabel="Dashboard" />
      <BlindLobby
        blind={blind as any}
        currentUserId={user.id}
        isHost={isHost}
        isMember={!!currentMember}
        firstSampleId={firstSample?.id ?? null}
      />
    </div>
  );
}
