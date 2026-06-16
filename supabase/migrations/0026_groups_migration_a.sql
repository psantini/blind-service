-- Migration A: Groups system
-- Additive only — existing guilds table, guild_id on blinds, and old RLS policy
-- are all preserved so the currently deployed code keeps working.
-- Run Migration B (0027) after the new code is deployed and verified.

create extension if not exists pgcrypto;

-- 1. Groups table (provider-agnostic replacement for guilds)
create table public.groups (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  discord_guild_id  text unique,  -- nullable: links to a Discord server for auto-sync
  icon_url          text,
  created_at        timestamptz default now() not null
);

alter table public.groups enable row level security;

create policy "groups: authenticated users can read"
  on public.groups for select
  to authenticated
  using (true);

-- 2. Copy existing guilds into groups (preserving IDs so group_id = guild_id below)
insert into public.groups (id, name, discord_guild_id, icon_url, created_at)
select
  id,
  name,
  discord_guild_id,
  case when icon_hash is not null
    then 'https://cdn.discordapp.com/icons/' || discord_guild_id || '/' || icon_hash || '.png'
    else null
  end,
  created_at
from public.guilds;

-- 3. Group members — source of truth for who belongs to which group
create table public.group_members (
  group_id   uuid references public.groups on delete cascade not null,
  user_id    uuid references public.profiles on delete cascade not null,
  role       text not null default 'member' check (role in ('admin', 'member')),
  joined_at  timestamptz default now() not null,
  primary key (group_id, user_id)
);

alter table public.group_members enable row level security;

create policy "group_members: users can read own memberships"
  on public.group_members for select
  to authenticated
  using (user_id = auth.uid());

-- 4. Backfill group_members from cached discord_guild_ids on profiles
insert into public.group_members (group_id, user_id)
select g.id, p.id
from public.profiles p
join public.groups g on g.discord_guild_id = any(p.discord_guild_ids)
on conflict do nothing;

-- 5. Group invites — multi-use links with expiry
create table public.group_invites (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid references public.groups on delete cascade not null,
  token       text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  created_by  uuid references public.profiles on delete cascade not null,
  max_uses    int,   -- null = unlimited
  use_count   int not null default 0,
  expires_at  timestamptz not null,
  created_at  timestamptz default now() not null
);

alter table public.group_invites enable row level security;

-- Any authenticated user can read an invite (needed to validate a token on the /join page)
create policy "group_invites: authenticated users can read"
  on public.group_invites for select
  to authenticated
  using (true);

-- 6. Add group_id to blinds alongside existing guild_id
alter table public.blinds
  add column group_id uuid references public.groups on delete set null;

-- IDs were preserved in step 2, so guild_id values are valid group IDs
update public.blinds set group_id = guild_id where guild_id is not null;

-- 7. New user_in_group() helper — checks group_members directly (no array scan)
create or replace function public.user_in_group(p_group_id uuid)
returns boolean language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = p_group_id
      and user_id = auth.uid()
  );
$$;

-- 8. New blinds read policy (runs alongside the old guild policy during transition)
create policy "blinds: readable if ungated or user is in the blind's group"
  on public.blinds for select
  to authenticated
  using (
    group_id is null
    or public.user_in_group(group_id)
  );
