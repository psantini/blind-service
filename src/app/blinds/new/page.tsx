import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Nav } from '@/components/ui/Nav';
import { NewBlindForm } from '@/components/blind/NewBlindForm';

export default async function NewBlindPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const adminClient = createAdminClient();

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    adminClient.from('group_members').select('group_id').eq('user_id', user.id),
  ]);

  const groupIds = (memberships ?? []).map(m => m.group_id);
  const { data: guilds } = groupIds.length > 0
    ? await adminClient.from('groups').select('id, name').in('id', groupIds).order('name')
    : { data: [] };

  return (
    <div className="min-h-screen">
      <Nav profile={profile} backHref="/dashboard" backLabel="Dashboard" />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-display italic font-bold text-parchment mb-1">New blind</h1>
        <p className="text-smoke text-sm mb-8">Configure the blind then add samples in the next step.</p>
        <NewBlindForm guilds={guilds ?? []} isSuperAdmin={profile?.is_super_admin ?? false} />
      </div>
    </div>
  );
}
