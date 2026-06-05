-- Guilds: Discord servers registered with the app.
-- A blind with guild_id set is only visible to users who are members of that server.

create table public.guilds (
  id                uuid primary key default gen_random_uuid(),
  discord_guild_id  text not null unique,
  name              text not null,
  icon_hash         text,
  created_at        timestamptz default now() not null
);

alter table public.guilds enable row level security;

-- Any authenticated user can read guilds (needed for guild selector on new blind form)
create policy "guilds: authenticated users can read"
  on public.guilds for select
  to authenticated
  using (true);

-- Cache of which Discord servers each user belongs to, refreshed on every login
alter table public.profiles
  add column discord_guild_ids text[] not null default '{}';

-- Which Discord server a blind belongs to. Null = any authenticated user can access.
alter table public.blinds
  add column guild_id uuid references public.guilds on delete set null;

-- Seed the BBC server and gate all existing blinds to it
insert into public.guilds (discord_guild_id, name)
values ('1299537647202734163', 'BBC');

update public.blinds
  set guild_id = (select id from public.guilds where discord_guild_id = '1299537647202734163');

-- Helper used by the blinds read policy
create or replace function public.user_in_guild(p_guild_id uuid)
returns boolean language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1
    from public.guilds g
    join public.profiles p on p.id = auth.uid()
    where g.id = p_guild_id
      and g.discord_guild_id = any(p.discord_guild_ids)
  );
$$;

-- Replace the open read policy with one that enforces guild membership
drop policy "blinds: authenticated users can read all" on public.blinds;

create policy "blinds: readable if ungated or user is in the blind's guild"
  on public.blinds for select
  to authenticated
  using (
    guild_id is null
    or public.user_in_guild(guild_id)
  );
