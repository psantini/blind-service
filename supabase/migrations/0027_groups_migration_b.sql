-- Migration B: Remove legacy guild tables and columns
-- Run ONLY after the new code (groups-and-google-auth branch) is deployed and verified.

-- Drop old guild-based blinds RLS policy
drop policy "blinds: readable if ungated or user is in the blind's guild" on public.blinds;

-- Drop guild_id from blinds (group_id is the replacement)
alter table public.blinds drop column guild_id;

-- Drop cached Discord guild array from profiles (group_members is the replacement)
alter table public.profiles drop column discord_guild_ids;

-- Drop old helper function
drop function if exists public.user_in_guild(uuid);

-- Drop guilds table (RLS policies cascade automatically)
drop table public.guilds;
