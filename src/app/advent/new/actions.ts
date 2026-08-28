'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

interface ManifestRow {
  userId: string;
  bottlesExpected: number;
}

interface AdventAttributeTemplate {
  name: string;
  inputType: string;
  scoringType: string;
  brackets: Array<{ max_delta: number; points: number }> | null;
}

export async function createAdventCalendar(params: {
  name: string;
  groupId: string;
  manifest: ManifestRow[];
  questionTemplates: AdventAttributeTemplate[];
}): Promise<{ redirectTo: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { name, groupId, manifest, questionTemplates } = params;

  if (!name.trim()) throw new Error('Calendar name is required');
  if (!groupId) throw new Error('A group is required');

  const total = manifest.reduce((sum, r) => sum + r.bottlesExpected, 0);
  if (total !== 24) throw new Error('Bottle total must equal 24');
  if (manifest.some(r => !r.userId)) throw new Error('All manifest rows must have a contributor selected');
  if (new Set(manifest.map(r => r.userId)).size !== manifest.length) throw new Error('Duplicate contributors in manifest');

  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    const { data: membership } = await adminClient
      .from('group_members')
      .select('group_id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();
    if (!membership) throw new Error('Forbidden');
  }

  const { data: blind, error: blindError } = await supabase
    .from('blinds')
    .insert({
      name: name.trim(),
      host_id: user.id,
      nosing_enabled: false,
      round_order: 'interleaved',
      status: 'setup',
      group_id: groupId,
    })
    .select('id')
    .single();

  if (blindError || !blind) throw blindError ?? new Error('Failed to create blind');

  await supabase.from('blind_members').insert({
    blind_id: blind.id,
    user_id: user.id,
    role: 'host',
  });

  const { data: advent, error: adventError } = await supabase
    .from('advent_calendars')
    .insert({
      blind_id: blind.id,
      status: 'collecting',
      question_templates: questionTemplates,
    })
    .select('id')
    .single();

  if (adventError || !advent) throw adventError ?? new Error('Failed to create advent calendar');

  await supabase.from('advent_contributor_manifest').insert(
    manifest.map(r => ({
      advent_calendar_id: advent.id,
      user_id: r.userId,
      bottles_expected: r.bottlesExpected,
    }))
  );

  return { redirectTo: `/advent/${advent.id}` };
}
