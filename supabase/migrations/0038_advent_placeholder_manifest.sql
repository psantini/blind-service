-- Allow placeholder contributors who haven't signed up yet.
-- user_id is now nullable; placeholder_name holds their display name
-- until they claim the slot by logging in via the invite link.
alter table public.advent_contributor_manifest
  alter column user_id drop not null;

alter table public.advent_contributor_manifest
  add column placeholder_name text;

-- Exactly one identity must be set
alter table public.advent_contributor_manifest
  add constraint advent_contributor_manifest_identity_check
  check (
    (user_id is not null and placeholder_name is null) or
    (user_id is null and placeholder_name is not null and placeholder_name != '')
  );
