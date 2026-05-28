-- The reveal-gate on attributes blocked participants from reading the
-- attribute metadata (name, input_type, scoring_type, brackets) needed
-- to render the question sheet before submission. The app already only
-- displays the value field post-reveal, so enforce that at the app layer
-- and open attribute rows to all blind members.

drop policy "attributes: host always, others after own reveal" on public.attributes;

create policy "attributes: blind members can read"
  on public.attributes for select
  to authenticated
  using (
    public.is_blind_member(public.blind_id_for_sample(sample_id))
  );
