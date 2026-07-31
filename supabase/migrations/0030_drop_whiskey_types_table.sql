-- whiskey_types table is unused — the app sources types from a hardcoded
-- TypeScript constant (src/lib/constants/whiskeyTypes.ts). Drop it to remove
-- the dead code. CASCADE drops the RLS policy defined in 0002.
drop table if exists public.whiskey_types cascade;
