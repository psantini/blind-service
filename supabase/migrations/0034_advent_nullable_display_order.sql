-- Advent samples don't get their day (display_order) until generation runs.
-- Allow NULL so contributor submissions can create samples without a day yet.
alter table public.samples alter column display_order drop not null;
