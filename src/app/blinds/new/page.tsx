import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Nav } from '@/components/ui/Nav';
import { NewBlindForm } from '@/components/blind/NewBlindForm';

export default async function NewBlindPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav profile={profile} backHref="/dashboard" backLabel="Dashboard" />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">New blind</h1>
        <p className="text-stone-500 text-sm mb-8">Configure the blind then add samples in the next step.</p>
        <NewBlindForm />
      </div>
    </div>
  );
}
