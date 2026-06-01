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
      round_order,
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

  if (currentMember && blind.status === 'complete') {
    redirect(`/blinds/${blindId}/leaderboard`);
  }

  const sortedSamples = [...(blind.samples as any[])].sort((a: any, b: any) => a.display_order - b.display_order);
  const sampleIds = sortedSamples.map((s: any) => s.id as string);

  let nextSampleId: string | null = null;
  if (currentMember && sampleIds.length > 0) {
    const [{ data: reveals }, { data: nosings }] = await Promise.all([
      supabase.from('sample_reveals').select('sample_id').eq('user_id', user.id).in('sample_id', sampleIds),
      blind.nosing_enabled
        ? supabase.from('sample_nosing_submissions').select('sample_id').eq('user_id', user.id).in('sample_id', sampleIds)
        : Promise.resolve({ data: [] }),
    ]);

    const revealedIds = new Set((reveals ?? []).map((r: any) => r.sample_id as string));
    const nosedIds = new Set((nosings ?? []).map((n: any) => n.sample_id as string));

    if (blind.nosing_enabled && blind.round_order === 'all_nose_first') {
      const firstUnnosed = sortedSamples.find((s: any) => !nosedIds.has(s.id));
      nextSampleId = firstUnnosed?.id ?? sortedSamples.find((s: any) => !revealedIds.has(s.id))?.id ?? null;
    } else {
      nextSampleId = sortedSamples.find((s: any) => !revealedIds.has(s.id))?.id ?? null;
    }

    return (
      <div className="min-h-screen">
        <Nav profile={profile} backHref="/dashboard" backLabel="Dashboard" />
        <BlindLobby
          blind={blind as any}
          currentUserId={user.id}
          isHost={isHost}
          isMember={!!currentMember}
          firstSampleId={nextSampleId}
          revealedSampleIds={revealedIds}
          nosedSampleIds={nosedIds}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Nav profile={profile} backHref="/dashboard" backLabel="Dashboard" />
      <BlindLobby
        blind={blind as any}
        currentUserId={user.id}
        isHost={isHost}
        isMember={!!currentMember}
        firstSampleId={nextSampleId}
        revealedSampleIds={new Set()}
        nosedSampleIds={new Set()}
      />
    </div>
  );
}
