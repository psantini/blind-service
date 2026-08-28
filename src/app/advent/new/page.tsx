import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Nav } from '@/components/ui/Nav';
import { AdventSetupForm } from '@/components/advent/AdventSetupForm';

export default async function NewAdventPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const adminClient = createAdminClient();

  let rawGroups: { id: string; name: string }[] = [];
  if (profile?.is_super_admin) {
    const { data } = await adminClient.from('groups').select('id, name').order('name');
    rawGroups = data ?? [];
  } else {
    const { data: memberships } = await adminClient
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);
    const groupIds = (memberships ?? []).map((m: any) => m.group_id);
    if (groupIds.length > 0) {
      const { data } = await adminClient.from('groups').select('id, name').in('id', groupIds).order('name');
      rawGroups = data ?? [];
    }
  }

  const groupIds = rawGroups.map(g => g.id);
  const { data: memberRows } = groupIds.length > 0
    ? await adminClient
        .from('group_members')
        .select('group_id, user_id, profile:profiles!user_id(id, discord_username)')
        .in('group_id', groupIds)
        .neq('user_id', user.id)
    : { data: [] };

  const groups = rawGroups.map(g => ({
    id: g.id,
    name: g.name,
    members: (memberRows ?? [])
      .filter((m: any) => m.group_id === g.id)
      .map((m: any) => ({ id: m.user_id, discord_username: m.profile.discord_username })),
  }));

  return (
    <div className="min-h-screen">
      <Nav profile={profile} backHref="/dashboard" backLabel="Dashboard" />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-display italic font-bold text-parchment mb-1">New advent calendar</h1>
        <p className="text-smoke text-sm mb-8">Set up the calendar, define contributors, and choose what info to collect per bottle.</p>
        <AdventSetupForm groups={groups} />
      </div>
    </div>
  );
}
