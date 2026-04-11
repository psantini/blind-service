-- ============================================================
-- PROFILES
-- Automatically populated on first Discord login via a trigger
-- ============================================================
create table public.profiles (
  id                  uuid references auth.users on delete cascade primary key,
  discord_username    text not null,
  discord_avatar_url  text,
  created_at          timestamptz default now() not null
);
comment on table public.profiles is
  'One row per authenticated user. Created automatically on first Discord login.';

-- Auto-create profile on new auth.users row
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, discord_username, discord_avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- WHISKEY TYPES
-- Static lookup table for the Type dropdown question
-- ============================================================
create table public.whiskey_types (
  id    uuid primary key default gen_random_uuid(),
  label text not null unique
);
comment on table public.whiskey_types is
  'Static list of whiskey type options shown in the Type dropdown.';


-- ============================================================
-- BLINDS
-- The overall tasting event
-- ============================================================
create table public.blinds (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  host_id         uuid references public.profiles not null,
  nosing_enabled  boolean not null default false,
  status          text not null default 'setup'
                    check (status in ('setup', 'active', 'complete')),
  created_at      timestamptz default now() not null
);
comment on table public.blinds is
  'A blind tasting event. Any authenticated user can create one (becoming host). '
  'Every blind is async-first; sync is a live UI layer, not a schema concern.';


-- ============================================================
-- BLIND MEMBERS
-- Who is participating in a blind
-- ============================================================
create table public.blind_members (
  id          uuid primary key default gen_random_uuid(),
  blind_id    uuid references public.blinds on delete cascade not null,
  user_id     uuid references public.profiles not null,
  role        text not null check (role in ('host', 'participant')),
  joined_at   timestamptz default now() not null,
  unique (blind_id, user_id)
);
comment on table public.blind_members is
  'Membership table. Host row created on blind creation. '
  'Participants join by navigating to the blind link.';


-- ============================================================
-- SAMPLES
-- The individual whiskey bottles in a blind
-- ============================================================
create table public.samples (
  id                uuid primary key default gen_random_uuid(),
  blind_id          uuid references public.blinds on delete cascade not null,
  label             text not null,
  display_order     int not null,
  bottle_image_url  text,
  unique (blind_id, display_order)
);
comment on table public.samples is
  'One row per whiskey sample in a blind. '
  'bottle_image_url is set by the host during setup and shown on the reveal '
  'screen alongside the whiskey identity after the participant submits.';


-- ============================================================
-- ATTRIBUTES
-- The facts the host enters for each sample (hidden until reveal)
-- ============================================================
create table public.attributes (
  id           uuid primary key default gen_random_uuid(),
  sample_id    uuid references public.samples on delete cascade not null,
  name         text not null,
  value        text not null,
  input_type   text not null check (input_type in ('text', 'dropdown', 'numeric', 'boolean')),
  scoring_type text not null check (scoring_type in ('exact', 'bracket')),
  brackets     jsonb
);
comment on table public.attributes is
  'Host-entered facts about a sample. Hidden from each participant until '
  'they reveal that sample (i.e. after they submit their answers for it).';


-- ============================================================
-- QUESTIONS
-- An attribute assigned to a round (nose / taste)
-- ============================================================
create table public.questions (
  id           uuid primary key default gen_random_uuid(),
  attribute_id uuid references public.attributes on delete cascade not null,
  round        text not null check (round in ('nose', 'taste')),
  unique (attribute_id, round)
);
comment on table public.questions is
  'Links an attribute to a tasting round. '
  'One attribute can generate two question rows (nose + taste).';


-- ============================================================
-- SAMPLE REVEALS
-- Per-participant reveal state
-- ============================================================
create table public.sample_reveals (
  id          uuid primary key default gen_random_uuid(),
  sample_id   uuid references public.samples on delete cascade not null,
  user_id     uuid references public.profiles not null,
  revealed_at timestamptz default now() not null,
  unique (sample_id, user_id)
);
comment on table public.sample_reveals is
  'Tracks when each participant revealed a sample. '
  'A row is inserted automatically when a participant submits all their answers '
  'for a sample.';


-- ============================================================
-- ANSWERS
-- Participant responses to questions
-- ============================================================
create table public.answers (
  id             uuid primary key default gen_random_uuid(),
  question_id    uuid references public.questions on delete cascade not null,
  user_id        uuid references public.profiles not null,
  value          text,
  submitted_at   timestamptz,
  fuzzy_flagged  boolean not null default false,
  host_approved  boolean,
  points_earned  numeric,
  unique (question_id, user_id)
);
comment on table public.answers is
  'One row per participant per question. '
  'Locked when submitted_at is set. '
  'Other participants'' answers visible only after the viewer has revealed that sample.';


-- ============================================================
-- INDEXES
-- ============================================================
create index on public.blind_members (blind_id);
create index on public.blind_members (user_id);
create index on public.samples (blind_id);
create index on public.attributes (sample_id);
create index on public.questions (attribute_id);
create index on public.sample_reveals (sample_id);
create index on public.sample_reveals (user_id);
create index on public.answers (question_id);
create index on public.answers (user_id);
create index on public.blinds (status);
create index on public.blinds (host_id);
create index on public.sample_reveals (sample_id, user_id);
create index on public.answers (submitted_at) where submitted_at is not null;
