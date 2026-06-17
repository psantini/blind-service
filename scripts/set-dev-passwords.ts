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

const users = [
  { id: 'aa000001-0000-0000-0000-000000000001', email: 'host@dev.test' },
  { id: 'aa000002-0000-0000-0000-000000000002', email: 'player1@dev.test' },
  { id: 'aa000003-0000-0000-0000-000000000003', email: 'player2@dev.test' },
  { id: 'aa000004-0000-0000-0000-000000000004', email: 'player3@dev.test' },
];

async function main() {
  for (const user of users) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password: 'devpassword' });
    if (error) {
      console.error(`✗ ${user.email}:`, error.message);
    } else {
      console.log(`✓ ${user.email}`);
    }
  }
}

main();
