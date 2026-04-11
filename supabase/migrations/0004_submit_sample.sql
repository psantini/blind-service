create or replace function public.submit_sample(
  p_sample_id uuid,
  p_user_id   uuid
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  -- 1. Lock all answers for this user + sample
  update public.answers
  set submitted_at = now()
  where user_id = p_user_id
    and submitted_at is null
    and question_id in (
      select q.id
      from public.questions q
      join public.attributes a on a.id = q.attribute_id
      where a.sample_id = p_sample_id
    );

  -- 2. Insert reveal row — unlocks attribute values + others' answers
  insert into public.sample_reveals (sample_id, user_id)
  values (p_sample_id, p_user_id)
  on conflict (sample_id, user_id) do nothing;

  -- 3. Score bracket and exact-match answers immediately
  perform public.score_sample_answers(p_sample_id, p_user_id);
end;
$$;
