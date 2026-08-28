/**
 * One-off script: fills in dummy submissions for all unsubmitted contributors
 * on a given advent calendar, then runs generation so the host can see the
 * host_setup view.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx tsx scripts/seed-advent-dummy.ts <adventId>
 */

import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adventId = process.argv[2];
if (!adventId) {
  console.error('Usage: npx tsx scripts/seed-advent-dummy.ts <adventId>');
  process.exit(1);
}

const db = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ALL_LETTERS = Array.from({ length: 24 }, (_, i) => String.fromCharCode(65 + i));

const DUMMY_DISTILLERIES = [
  'Buffalo Trace', 'Wild Turkey', 'Four Roses', 'Maker\'s Mark', 'Knob Creek',
  'Woodford Reserve', 'Heaven Hill', 'Old Forester', 'Elijah Craig', 'Larceny',
  'Bulleit', 'Jim Beam', 'Evan Williams', 'Michter\'s', 'Angel\'s Envy',
  'Blanton\'s', 'Eagle Rare', 'W.L. Weller', 'Pappy Van Winkle', 'George T. Stagg',
  'Booker\'s', 'Baker\'s', 'Basil Hayden', 'Legent',
];

async function main() {
  // Fetch advent calendar
  const { data: advent } = await db
    .from('advent_calendars')
    .select('id, blind_id, status, question_templates')
    .eq('id', adventId)
    .single();

  if (!advent) { console.error('Advent calendar not found'); process.exit(1); }
  if (advent.status !== 'collecting') {
    console.error(`Status is '${advent.status}', expected 'collecting'`);
    process.exit(1);
  }

  // Fetch unsubmitted manifest rows with profiles
  const { data: manifest } = await db
    .from('advent_contributor_manifest')
    .select('id, user_id, bottles_expected, has_submitted, profile:profiles!user_id(discord_username)')
    .eq('advent_calendar_id', adventId);

  const unsubmitted = (manifest ?? []).filter((r: any) => !r.has_submitted);
  console.log(`Found ${unsubmitted.length} unsubmitted contributor(s)`);

  // Find taken letters
  const { data: existing } = await db
    .from('advent_assignments')
    .select('letter')
    .eq('advent_calendar_id', adventId);

  const taken = new Set((existing ?? []).map((a: any) => a.letter));
  const available = ALL_LETTERS.filter(l => !taken.has(l));

  const letterPool = [...available].sort(() => Math.random() - 0.5);
  let distilleryIdx = taken.size; // offset so we don't reuse names for existing samples

  for (const row of unsubmitted as any[]) {
    const username = row.profile?.discord_username ?? row.user_id;
    console.log(`  Submitting ${row.bottles_expected} bottle(s) for ${username}…`);

    for (let b = 0; b < row.bottles_expected; b++) {
      const letter = letterPool.shift()!;
      const distillery = DUMMY_DISTILLERIES[distilleryIdx++ % DUMMY_DISTILLERIES.length]!;

      // Create sample (no photo for dummy data)
      const { data: sample } = await db
        .from('samples')
        .insert({
          blind_id: advent.blind_id,
          label: letter,
          display_order: null,
          bottle_image_url: null,
        })
        .select('id')
        .single();

      if (!sample) { console.error('Failed to create sample'); process.exit(1); }

      // Create attributes from question templates (with dummy values)
      for (const tmpl of (advent.question_templates as any[])) {
        let value: string;
        if (tmpl.name === 'finished') value = 'no';
        else if (tmpl.inputType === 'boolean') value = 'no';
        else if (tmpl.inputType === 'numeric') value = String(Math.floor(Math.random() * 10 + 4));
        else if (tmpl.inputType === 'dropdown') value = 'Bourbon';
        else value = distillery;

        const { data: attr } = await db
          .from('attributes')
          .insert({
            sample_id: sample.id,
            name: tmpl.name,
            value,
            input_type: tmpl.inputType,
            scoring_type: tmpl.scoringType,
            brackets: tmpl.brackets,
          })
          .select('id')
          .single();

        if (!attr) { console.error(`Failed to create attribute ${tmpl.name}`); process.exit(1); }
        await db.from('questions').insert({ attribute_id: attr.id, round: 'taste' });
      }

      // Create assignment
      const { error: assignErr } = await db.from('advent_assignments').insert({
        advent_calendar_id: adventId,
        sample_id: sample.id,
        contributor_user_id: row.user_id,
        letter,
        day: null,
      });
      if (assignErr) { console.error('Failed to create assignment:', assignErr.message); process.exit(1); }
    }

    // Mark submitted + add as blind member
    await db.from('advent_contributor_manifest').update({ has_submitted: true }).eq('id', row.id);
    await db.from('blind_members').upsert(
      { blind_id: advent.blind_id, user_id: row.user_id, role: 'participant' },
      { onConflict: 'blind_id,user_id', ignoreDuplicates: true }
    );
  }

  // Check if all submitted
  const { data: remaining } = await db
    .from('advent_contributor_manifest')
    .select('id')
    .eq('advent_calendar_id', adventId)
    .eq('has_submitted', false);

  if ((remaining ?? []).length > 0) {
    console.log('Not all contributors submitted — skipping generation');
    return;
  }

  console.log('All submitted — generating blind…');

  // Fisher-Yates shuffle days 1–24
  const { data: assignments } = await db
    .from('advent_assignments')
    .select('id, sample_id, contributor_user_id, profile:profiles!contributor_user_id(discord_username)')
    .eq('advent_calendar_id', adventId);

  if (!assignments || assignments.length !== 24) {
    console.error(`Expected 24 assignments, got ${assignments?.length ?? 0}`);
    process.exit(1);
  }

  const days = Array.from({ length: 24 }, (_, i) => i + 1);
  for (let i = days.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [days[i], days[j]] = [days[j]!, days[i]!];
  }

  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i] as any;
    const day = days[i]!;
    const username = a.profile?.discord_username ?? 'unknown';

    await db.from('advent_assignments').update({ day }).eq('id', a.id);
    await db.from('samples').update({ display_order: day, label: String(day) }).eq('id', a.sample_id);

    const { data: whoAttr } = await db.from('attributes').insert({
      sample_id: a.sample_id, name: 'who submitted this', value: username,
      input_type: 'dropdown', scoring_type: 'exact', brackets: [{ max_delta: 0, points: 1 }],
    }).select('id').single();
    if (whoAttr) await db.from('questions').insert({ attribute_id: whoAttr.id, round: 'taste' });

    const { data: ratingAttr } = await db.from('attributes').insert({
      sample_id: a.sample_id, name: 'rating', value: '',
      input_type: 'numeric', scoring_type: 'none', brackets: null,
    }).select('id').single();
    if (ratingAttr) await db.from('questions').insert({ attribute_id: ratingAttr.id, round: 'taste' });

    const { data: thoughtsAttr } = await db.from('attributes').insert({
      sample_id: a.sample_id, name: 'thoughts', value: '',
      input_type: 'textarea', scoring_type: 'none', brackets: null,
    }).select('id').single();
    if (thoughtsAttr) await db.from('questions').insert({ attribute_id: thoughtsAttr.id, round: 'taste' });
  }

  await db.from('advent_calendars').update({ status: 'host_setup' }).eq('id', adventId);

  console.log('Done — advent calendar is now in host_setup state.');
}

main().catch(err => { console.error(err); process.exit(1); });
