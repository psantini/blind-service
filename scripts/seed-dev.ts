import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const AGE_BRACKETS    = [{ max_delta: 0, points: 5 }, { max_delta: 1, points: 4 }, { max_delta: 2, points: 3 }, { max_delta: 5, points: 2 }, { max_delta: 10, points: 1 }];
const PROOF_BRACKETS  = [{ max_delta: 0, points: 5 }, { max_delta: 2, points: 4 }, { max_delta: 5, points: 3 }, { max_delta: 10, points: 2 }, { max_delta: 20, points: 1 }];
const EXACT_BRACKETS  = [{ max_delta: 0, points: 3 }];

const SAMPLES = [
  {
    label: 'A', order: 1,
    attrs: [
      { name: 'type',       value: 'Bourbon',       input_type: 'dropdown', scoring_type: 'exact',   brackets: EXACT_BRACKETS },
      { name: 'distillery', value: "Maker's Mark",  input_type: 'text',     scoring_type: 'exact',   brackets: EXACT_BRACKETS },
      { name: 'age',        value: '6',             input_type: 'numeric',  scoring_type: 'bracket', brackets: AGE_BRACKETS },
      { name: 'proof',      value: '94',            input_type: 'numeric',  scoring_type: 'bracket', brackets: PROOF_BRACKETS },
      { name: 'finished',   value: 'no',            input_type: 'boolean',  scoring_type: 'exact',   brackets: EXACT_BRACKETS },
    ],
  },
  {
    label: 'B', order: 2,
    attrs: [
      { name: 'type',       value: 'Bourbon',       input_type: 'dropdown', scoring_type: 'exact',   brackets: EXACT_BRACKETS },
      { name: 'distillery', value: 'Buffalo Trace', input_type: 'text',     scoring_type: 'exact',   brackets: EXACT_BRACKETS },
      { name: 'age',        value: '8',             input_type: 'numeric',  scoring_type: 'bracket', brackets: AGE_BRACKETS },
      { name: 'proof',      value: '90',            input_type: 'numeric',  scoring_type: 'bracket', brackets: PROOF_BRACKETS },
      { name: 'finished',   value: 'no',            input_type: 'boolean',  scoring_type: 'exact',   brackets: EXACT_BRACKETS },
    ],
  },
  {
    label: 'C', order: 3,
    attrs: [
      { name: 'type',       value: 'Bourbon',       input_type: 'dropdown', scoring_type: 'exact',   brackets: EXACT_BRACKETS },
      { name: 'distillery', value: 'Buffalo Trace', input_type: 'text',     scoring_type: 'exact',   brackets: EXACT_BRACKETS },
      { name: 'age',        value: '17',            input_type: 'numeric',  scoring_type: 'bracket', brackets: AGE_BRACKETS },
      { name: 'proof',      value: '101',           input_type: 'numeric',  scoring_type: 'bracket', brackets: PROOF_BRACKETS },
      { name: 'finished',   value: 'no',            input_type: 'boolean',  scoring_type: 'exact',   brackets: EXACT_BRACKETS },
    ],
  },
];

// answers[playerIndex][sampleIndex][attrName] = { value, points }
const ANSWERS = [
  // player1 — strong
  [
    { type: { v: 'Bourbon', p: 3 }, distillery: { v: "Maker's Mark", p: 3 }, age: { v: '6', p: 5 }, proof: { v: '96', p: 3 }, finished: { v: 'no', p: 3 } },
    { type: { v: 'Bourbon', p: 3 }, distillery: { v: 'Buffalo Trace', p: 3 }, age: { v: '10', p: 2 }, proof: { v: '92', p: 4 }, finished: { v: 'no', p: 3 } },
    { type: { v: 'Bourbon', p: 3 }, distillery: { v: 'Eagle Rare', p: 0 }, age: { v: '15', p: 3 }, proof: { v: '101', p: 5 }, finished: { v: 'no', p: 3 } },
  ],
  // player2 — average
  [
    { type: { v: 'Bourbon', p: 3 }, distillery: { v: 'Wild Turkey', p: 0 }, age: { v: '8', p: 3 }, proof: { v: '100', p: 2 }, finished: { v: 'no', p: 3 } },
    { type: { v: 'Bourbon', p: 3 }, distillery: { v: 'Heaven Hill', p: 0 }, age: { v: '8', p: 5 }, proof: { v: '88', p: 3 }, finished: { v: 'no', p: 3 } },
    { type: { v: 'Rye', p: 0 }, distillery: { v: 'Buffalo Trace', p: 3 }, age: { v: '20', p: 2 }, proof: { v: '105', p: 3 }, finished: { v: 'yes', p: 0 } },
  ],
  // player3 — struggling
  [
    { type: { v: 'Rye', p: 0 }, distillery: { v: 'Heaven Hill', p: 0 }, age: { v: '12', p: 1 }, proof: { v: '110', p: 2 }, finished: { v: 'no', p: 3 } },
    { type: { v: 'Bourbon', p: 3 }, distillery: { v: 'Four Roses', p: 0 }, age: { v: '5', p: 2 }, proof: { v: '80', p: 1 }, finished: { v: 'yes', p: 0 } },
    { type: { v: 'Bourbon', p: 3 }, distillery: { v: 'Barton', p: 0 }, age: { v: '10', p: 1 }, proof: { v: '120', p: 2 }, finished: { v: 'no', p: 3 } },
  ],
];

async function main() {
  // ── 1. Wipe existing dev data ─────────────────────────────────────────────
  console.log('Wiping existing dev data...');
  await supabase.from('blinds').delete().eq('name', 'Dev Spring Blind');
  await supabase.from('groups').delete().eq('name', 'BBC Dev');

  // Delete any SQL-inserted stale users with known fixed IDs first
  const KNOWN_STALE_IDS = [
    'aa000001-0000-0000-0000-000000000001',
    'aa000002-0000-0000-0000-000000000002',
    'aa000003-0000-0000-0000-000000000003',
    'aa000004-0000-0000-0000-000000000004',
  ];
  for (const id of KNOWN_STALE_IDS) {
    await supabase.auth.admin.deleteUser(id);
  }

  // Also catch any GoTrue-managed dev users from prior runs
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  for (const u of existingUsers?.users ?? []) {
    if (u.email?.endsWith('@dev.test')) {
      await supabase.auth.admin.deleteUser(u.id);
    }
  }

  // ── 2. Create auth users ──────────────────────────────────────────────────
  console.log('Creating users...');
  const devUsers = [
    { username: 'dev_host',    email: 'host@dev.test',    superAdmin: true },
    { username: 'dev_player1', email: 'player1@dev.test', superAdmin: false },
    { username: 'dev_player2', email: 'player2@dev.test', superAdmin: false },
    { username: 'dev_player3', email: 'player3@dev.test', superAdmin: false },
  ];

  const createdUsers: { id: string; username: string; superAdmin: boolean }[] = [];
  for (const u of devUsers) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: 'devpassword',
      email_confirm: true,
      user_metadata: { full_name: u.username },
    });
    if (error || !data.user) { console.error(`✗ ${u.email}:`, error?.message); process.exit(1); }
    createdUsers.push({ id: data.user.id, username: u.username, superAdmin: u.superAdmin });
    console.log(`  ✓ ${u.username} (${data.user.id})`);
  }

  // ── 3. Patch super admin ──────────────────────────────────────────────────
  const hostId = createdUsers[0]!.id;
  await supabase.from('profiles').update({ is_super_admin: true }).eq('id', hostId);

  // ── 4. Group + members ────────────────────────────────────────────────────
  console.log('Creating group...');
  const { data: group } = await supabase.from('groups').insert({ name: 'BBC Dev' }).select('id').single();
  const groupId = group!.id;

  await supabase.from('group_members').insert([
    { group_id: groupId, user_id: hostId, role: 'admin' },
    ...createdUsers.slice(1).map(u => ({ group_id: groupId, user_id: u.id, role: 'member' })),
  ]);

  // ── 5. Blind + members ────────────────────────────────────────────────────
  console.log('Creating blind...');
  const { data: blind } = await supabase.from('blinds')
    .insert({ name: 'Dev Spring Blind', host_id: hostId, group_id: groupId, status: 'complete', nosing_enabled: false, round_order: 'interleaved' })
    .select('id').single();
  const blindId = blind!.id;

  const players = createdUsers.slice(1);
  await supabase.from('blind_members').insert([
    { blind_id: blindId, user_id: hostId, role: 'host' },
    ...players.map(u => ({ blind_id: blindId, user_id: u.id, role: 'participant' })),
  ]);

  // ── 6. Samples, attributes, questions ────────────────────────────────────
  console.log('Creating samples...');
  const sampleIds: string[] = [];
  const questionMaps: Record<string, string>[] = []; // attrName → questionId

  for (const s of SAMPLES) {
    const { data: sample } = await supabase.from('samples')
      .insert({ blind_id: blindId, label: s.label, display_order: s.order })
      .select('id').single();
    sampleIds.push(sample!.id);

    const qMap: Record<string, string> = {};
    for (const attr of s.attrs) {
      const { data: attrRow } = await supabase.from('attributes')
        .insert({ sample_id: sample!.id, name: attr.name, value: attr.value, input_type: attr.input_type, scoring_type: attr.scoring_type, brackets: attr.brackets })
        .select('id').single();
      const { data: q } = await supabase.from('questions')
        .insert({ attribute_id: attrRow!.id, round: 'taste' })
        .select('id').single();
      qMap[attr.name] = q!.id;
    }
    questionMaps.push(qMap);
  }

  // ── 7. Sample reveals + answers ───────────────────────────────────────────
  console.log('Creating answers...');
  for (let pi = 0; pi < players.length; pi++) {
    const userId = players[pi]!.id;
    for (let si = 0; si < SAMPLES.length; si++) {
      await supabase.from('sample_reveals').insert({ sample_id: sampleIds[si], user_id: userId });
      const attrNames = Object.keys(ANSWERS[pi]![si]!);
      await supabase.from('answers').insert(
        attrNames.map(name => ({
          question_id: questionMaps[si]![name],
          user_id: userId,
          value: (ANSWERS[pi]![si]! as any)[name].v,
          submitted_at: new Date().toISOString(),
          points_earned: (ANSWERS[pi]![si]! as any)[name].p,
        }))
      );
    }
  }

  // ── 8. Verify ─────────────────────────────────────────────────────────────
  const { data: stats } = await supabase.from('all_time_stats').select('discord_username, total_points').order('total_points', { ascending: false });
  console.log('\nFinal leaderboard:');
  for (const s of stats ?? []) {
    if (Number(s.total_points) > 0) console.log(`  ${s.discord_username}: ${s.total_points} pts`);
  }
  console.log('\nDone. Password for all dev users: devpassword');
}

main().catch(console.error);
