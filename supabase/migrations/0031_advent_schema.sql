-- ============================================================
-- ADVENT CALENDARS
-- One per advent blind. Tracks setup phase and holds the
-- invite token used by contributors to access the submission form.
-- ============================================================
create table public.advent_calendars (
  id               uuid primary key default gen_random_uuid(),
  blind_id         uuid references public.blinds on delete cascade not null unique,
  status           text not null default 'collecting'
                     check (status in ('collecting', 'host_setup', 'complete')),
  invite_token     text not null unique default gen_random_uuid()::text,
  created_at       timestamptz not null default now()
);

-- ============================================================
-- ADVENT CONTRIBUTOR MANIFEST
-- Host-defined list of expected contributors and how many
-- bottles each is expected to submit. Must sum to 24.
-- Enforced in server action, not DB (single-row check only).
-- ============================================================
create table public.advent_contributor_manifest (
  id                   uuid primary key default gen_random_uuid(),
  advent_calendar_id   uuid references public.advent_calendars on delete cascade not null,
  user_id              uuid references public.profiles on delete cascade not null,
  bottles_expected     int not null check (bottles_expected > 0),
  has_submitted        bool not null default false,
  unique (advent_calendar_id, user_id)
);

-- ============================================================
-- ADVENT ASSIGNMENTS
-- One row per contributed bottle. Letter is assigned randomly
-- at submission time so the contributor can label their bottle.
-- Day is assigned randomly at generation time.
-- ============================================================
create table public.advent_assignments (
  id                   uuid primary key default gen_random_uuid(),
  advent_calendar_id   uuid references public.advent_calendars on delete cascade not null,
  sample_id            uuid references public.samples on delete cascade not null unique,
  contributor_user_id  uuid references public.profiles on delete cascade not null,
  letter               char(1) not null check (letter >= 'A' and letter <= 'X'),
  day                  int check (day >= 1 and day <= 24),
  unique (advent_calendar_id, letter),
  unique nulls not distinct (advent_calendar_id, day)
);
