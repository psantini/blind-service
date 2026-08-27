-- ============================================================
-- RLS for advent tables
-- ============================================================
alter table public.advent_calendars           enable row level security;
alter table public.advent_contributor_manifest enable row level security;
alter table public.advent_assignments          enable row level security;

-- Helper: resolve blind_id from an advent_calendar_id
create or replace function public.blind_id_for_advent(p_advent_id uuid)
returns uuid language sql security definer stable as $$
  select blind_id from public.advent_calendars where id = p_advent_id;
$$;

-- ============================================================
-- ADVENT CALENDARS
-- Host can read and write. Blind members can read (so the
-- pending blind shows up on their dashboard).
-- ============================================================
create policy "advent_calendars: blind members can read"
  on public.advent_calendars for select
  to authenticated
  using (public.is_blind_member(blind_id));

create policy "advent_calendars: host can insert"
  on public.advent_calendars for insert
  to authenticated
  with check (public.is_blind_host(blind_id));

create policy "advent_calendars: host can update"
  on public.advent_calendars for update
  to authenticated
  using (public.is_blind_host(blind_id));

-- ============================================================
-- ADVENT CONTRIBUTOR MANIFEST
-- Host can read and write all rows.
-- Contributors can read their own row (to check submission status).
-- ============================================================
create policy "advent_contributor_manifest: host can read all"
  on public.advent_contributor_manifest for select
  to authenticated
  using (public.is_blind_host(public.blind_id_for_advent(advent_calendar_id)));

create policy "advent_contributor_manifest: contributor can read own row"
  on public.advent_contributor_manifest for select
  to authenticated
  using (user_id = auth.uid());

create policy "advent_contributor_manifest: host can insert"
  on public.advent_contributor_manifest for insert
  to authenticated
  with check (public.is_blind_host(public.blind_id_for_advent(advent_calendar_id)));

create policy "advent_contributor_manifest: host can update"
  on public.advent_contributor_manifest for update
  to authenticated
  using (public.is_blind_host(public.blind_id_for_advent(advent_calendar_id)));

-- ============================================================
-- ADVENT ASSIGNMENTS
-- Host can read all rows (needs letter→day to know which bottle
-- to open on which day). Contributors can read only their own
-- rows (to see their assigned letters after submission).
-- Other participants have no access — the "who submitted this"
-- answer is revealed via the normal blind reveal flow, not here.
-- ============================================================
create policy "advent_assignments: host can read all"
  on public.advent_assignments for select
  to authenticated
  using (public.is_blind_host(public.blind_id_for_advent(advent_calendar_id)));

create policy "advent_assignments: contributor can read own"
  on public.advent_assignments for select
  to authenticated
  using (contributor_user_id = auth.uid());

create policy "advent_assignments: host can insert"
  on public.advent_assignments for insert
  to authenticated
  with check (public.is_blind_host(public.blind_id_for_advent(advent_calendar_id)));

create policy "advent_assignments: host can update"
  on public.advent_assignments for update
  to authenticated
  using (public.is_blind_host(public.blind_id_for_advent(advent_calendar_id)));
