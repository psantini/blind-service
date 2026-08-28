'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const ALL_LETTERS = Array.from({ length: 24 }, (_, i) => String.fromCharCode(65 + i));

interface BottleInput {
  photoUrl: string;
  fields: Array<{
    name: string;
    inputType: string;
    scoringType: string;
    brackets: Array<{ max_delta: number; points: number }> | null;
    value: string;
  }>;
}

export async function submitContributorBottles(params: {
  adventId: string;
  bottles: BottleInput[];
}): Promise<{ assignments: Array<{ letter: string; photoUrl: string }> }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { adventId, bottles } = params;
  const adminClient = createAdminClient();

  const { data: advent } = await adminClient
    .from('advent_calendars')
    .select('id, blind_id, status')
    .eq('id', adventId)
    .single();

  if (!advent) throw new Error('Advent calendar not found');
  if (advent.status !== 'collecting') throw new Error('Submissions are closed');

  const { data: manifestRow } = await adminClient
    .from('advent_contributor_manifest')
    .select('id, bottles_expected, has_submitted')
    .eq('advent_calendar_id', adventId)
    .eq('user_id', user.id)
    .single();

  if (!manifestRow) throw new Error('You are not on the contributor list');
  if (manifestRow.has_submitted) throw new Error('You have already submitted');
  if (bottles.length !== manifestRow.bottles_expected) {
    throw new Error(`Expected ${manifestRow.bottles_expected} bottles, got ${bottles.length}`);
  }

  // Determine remaining available letters
  const { data: existingAssignments } = await adminClient
    .from('advent_assignments')
    .select('letter')
    .eq('advent_calendar_id', adventId);

  const takenLetters = new Set((existingAssignments ?? []).map((a: any) => a.letter));
  const available = ALL_LETTERS.filter(l => !takenLetters.has(l));
  if (available.length < bottles.length) throw new Error('Not enough letters available — try again');

  // Randomly pick from remaining pool
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const assignedLetters = shuffled.slice(0, bottles.length);

  const assignments: Array<{ letter: string; photoUrl: string }> = [];

  for (let i = 0; i < bottles.length; i++) {
    const bottle = bottles[i]!;
    const letter = assignedLetters[i]!;

    const { data: sample } = await adminClient
      .from('samples')
      .insert({
        blind_id: advent.blind_id,
        label: letter,
        display_order: null,
        bottle_image_url: bottle.photoUrl,
      })
      .select('id')
      .single();

    if (!sample) throw new Error('Failed to create sample');

    for (const field of bottle.fields) {
      const { data: attr } = await adminClient
        .from('attributes')
        .insert({
          sample_id: sample.id,
          name: field.name,
          value: field.value,
          input_type: field.inputType,
          scoring_type: field.scoringType,
          brackets: field.brackets,
        })
        .select('id')
        .single();

      if (!attr) throw new Error('Failed to create attribute');

      await adminClient.from('questions').insert({ attribute_id: attr.id, round: 'taste' });
    }

    const { error: assignmentError } = await adminClient.from('advent_assignments').insert({
      advent_calendar_id: adventId,
      sample_id: sample.id,
      contributor_user_id: user.id,
      letter,
      day: null,
    });

    if (assignmentError) throw assignmentError;

    assignments.push({ letter, photoUrl: bottle.photoUrl });
  }

  // Mark contributor as submitted
  await adminClient
    .from('advent_contributor_manifest')
    .update({ has_submitted: true })
    .eq('id', manifestRow.id);

  // Add contributor as blind member
  await supabase.from('blind_members').upsert(
    { blind_id: advent.blind_id, user_id: user.id, role: 'participant' },
    { onConflict: 'blind_id,user_id', ignoreDuplicates: true }
  );

  // If all contributors have submitted, generate the blind automatically
  const { data: remaining } = await adminClient
    .from('advent_contributor_manifest')
    .select('id')
    .eq('advent_calendar_id', adventId)
    .eq('has_submitted', false);

  if ((remaining ?? []).length === 0) {
    await generateAdventBlind(adventId);
  }

  revalidatePath('/dashboard');
  return { assignments };
}

async function generateAdventBlind(adventId: string) {
  const adminClient = createAdminClient();

  const { data: assignments } = await adminClient
    .from('advent_assignments')
    .select('id, sample_id, contributor_user_id, letter, profile:profiles!contributor_user_id(discord_username)')
    .eq('advent_calendar_id', adventId);

  if (!assignments || assignments.length !== 24) return;

  // Shuffle days 1–24
  const days = Array.from({ length: 24 }, (_, i) => i + 1);
  for (let i = days.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [days[i], days[j]] = [days[j]!, days[i]!];
  }

  for (let i = 0; i < assignments.length; i++) {
    const assignment = assignments[i]!;
    const day = days[i]!;
    const username = (assignment.profile as any)?.discord_username ?? 'unknown';

    await adminClient
      .from('advent_assignments')
      .update({ day })
      .eq('id', assignment.id);

    await adminClient
      .from('samples')
      .update({ display_order: day, label: String(day) })
      .eq('id', assignment.sample_id);

    // Auto-create "who submitted this" attribute + question
    const { data: whoAttr } = await adminClient
      .from('attributes')
      .insert({
        sample_id: assignment.sample_id,
        name: 'who submitted this',
        value: username,
        input_type: 'dropdown',
        scoring_type: 'exact',
        brackets: [{ max_delta: 0, points: 1 }],
      })
      .select('id')
      .single();

    if (whoAttr) {
      await adminClient.from('questions').insert({ attribute_id: whoAttr.id, round: 'taste' });
    }

    // Auto-create "rating" attribute + question
    const { data: ratingAttr } = await adminClient
      .from('attributes')
      .insert({
        sample_id: assignment.sample_id,
        name: 'rating',
        value: '',
        input_type: 'numeric',
        scoring_type: 'none',
        brackets: null,
      })
      .select('id')
      .single();

    if (ratingAttr) {
      await adminClient.from('questions').insert({ attribute_id: ratingAttr.id, round: 'taste' });
    }

    // Auto-create "thoughts" attribute + question
    const { data: thoughtsAttr } = await adminClient
      .from('attributes')
      .insert({
        sample_id: assignment.sample_id,
        name: 'thoughts',
        value: '',
        input_type: 'textarea',
        scoring_type: 'none',
        brackets: null,
      })
      .select('id')
      .single();

    if (thoughtsAttr) {
      await adminClient.from('questions').insert({ attribute_id: thoughtsAttr.id, round: 'taste' });
    }
  }

  await adminClient
    .from('advent_calendars')
    .update({ status: 'host_setup' })
    .eq('id', adventId);

  revalidatePath('/dashboard');
  revalidatePath(`/advent/${adventId}`);
}
