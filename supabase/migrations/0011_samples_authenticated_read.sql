-- Sample labels (A, B, C, D) are not sensitive — the whiskey identity is
-- protected by the attributes RLS (hidden until reveal). Allow any
-- authenticated user to read sample rows so non-members see the correct
-- sample count on the blind lobby page.

drop policy "samples: blind members can read" on public.samples;

create policy "samples: authenticated users can read"
  on public.samples for select
  to authenticated
  using (true);
