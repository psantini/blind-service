alter table public.advent_calendars
  add column question_templates jsonb not null default '[]'::jsonb;
