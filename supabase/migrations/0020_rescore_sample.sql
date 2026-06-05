-- Resets scores for all submitted answers on a sample and rescores per user.
-- Called by the host setup action after updating sample attribute values.
create or replace function public.rescore_sample(p_sample_id uuid)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
begin
  -- Reset all submitted answers for this sample so score_sample_answers will reprocess them.
  -- host_approved is also cleared because the correct answer may have changed.
  update public.answers a
  set points_earned = null,
      fuzzy_flagged = false,
      host_approved = null
  from public.questions q
  join public.attributes attr on attr.id = q.attribute_id
  where q.id = a.question_id
    and attr.sample_id = p_sample_id
    and a.submitted_at is not null;

  -- Rescore per user
  for v_user_id in
    select distinct a.user_id
    from public.answers a
    join public.questions q on q.id = a.question_id
    join public.attributes attr on attr.id = q.attribute_id
    where attr.sample_id = p_sample_id
      and a.submitted_at is not null
  loop
    perform public.score_sample_answers(p_sample_id, v_user_id);
  end loop;
end;
$$;
