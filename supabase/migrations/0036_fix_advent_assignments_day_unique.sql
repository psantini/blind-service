-- NULLS NOT DISTINCT caused only the first assignment (day=null) to insert
-- successfully. All assignments start with day=null until generation runs,
-- so we need the default NULLS DISTINCT behaviour (multiple NULLs allowed).
alter table public.advent_assignments
  drop constraint if exists advent_assignments_advent_calendar_id_day_key;

alter table public.advent_assignments
  add constraint advent_assignments_advent_calendar_id_day_key
  unique (advent_calendar_id, day);
