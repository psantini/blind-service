import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Nav } from '@/components/ui/Nav';
import { SampleSetupForm } from '@/components/blind/SampleSetupForm';

export default async function HostSetupPage({
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
    .select('id, name, status, nosing_enabled, host_id')
    .eq('id', blindId)
    .single();

  if (!blind || blind.host_id !== user.id) redirect('/dashboard');

  const { data: samples } = await supabase
    .from('samples')
    .select(`
      id,
      label,
      display_order,
      bottle_image_url,
      attributes (
        id,
        name,
        value,
        input_type,
        scoring_type,
        brackets,
        questions ( id, round )
      )
    `)
    .eq('blind_id', blindId)
    .order('display_order');

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav
        profile={profile}
        backHref={`/blinds/${blindId}`}
        backLabel="Lobby"
      />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">{blind.name}</h1>
        <p className="text-stone-500 text-sm mb-8">Add samples and assign questions to rounds.</p>
        <SampleSetupForm
          blindId={blindId}
          nosingEnabled={blind.nosing_enabled}
          blindStatus={blind.status as any}
          initialSamples={samples as any ?? []}
        />
      </div>
    </div>
  );
}
