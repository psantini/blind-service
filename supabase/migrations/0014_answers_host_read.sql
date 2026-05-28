-- The host never submits answers, so has_user_revealed_sample is always false
-- for them — they couldn't read any participant answers. The host needs full
-- read access to run scoring, fuzzy review, and live standings.

drop policy "answers: own always, others after own reveal" on public.answers;

create policy "answers: own always, host always, others after own reveal"
  on public.answers for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_blind_host(public.blind_id_for_question(question_id))
    or (
      public.has_user_revealed_sample(
        public.sample_id_for_question(question_id)
      )
      and public.is_blind_member(
        public.blind_id_for_question(question_id)
      )
    )
  );
