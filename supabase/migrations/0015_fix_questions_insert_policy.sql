-- The questions INSERT policy used blind_id_for_question(id), which queries the
-- questions table for the new row's own ID. That row doesn't exist yet at check
-- time, so the function always returns NULL and every insert was silently rejected.
-- All questions in the DB came from migration 0013's backfill, not the host UI.
--
-- Fix: use attribute_id (present in the new row) to reach the blind via attributes
-- and samples, which already exist when the question is being inserted.

drop policy "questions: host can insert" on public.questions;

create or replace function public.blind_id_for_attribute(p_attribute_id uuid)
returns uuid language sql security definer stable as $$
  select s.blind_id
  from public.attributes a
  join public.samples s on s.id = a.sample_id
  where a.id = p_attribute_id;
$$;

create policy "questions: host can insert"
  on public.questions for insert
  to authenticated
  with check (
    public.is_blind_host(
      public.blind_id_for_attribute(attribute_id)
    )
  );
