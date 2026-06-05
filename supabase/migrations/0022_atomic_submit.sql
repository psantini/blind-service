-- Wraps answer-locking + reveal insert in a single transaction so they
-- either both commit or neither does. Scoring runs in TypeScript afterward.

create or replace function public.lock_and_reveal_sample(
  p_sample_id uuid,
  p_user_id   uuid
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
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

  insert into public.sample_reveals (sample_id, user_id)
  values (p_sample_id, p_user_id)
  on conflict (sample_id, user_id) do nothing;
end;
$$;

create or replace function public.lock_and_submit_nosing(
  p_sample_id uuid,
  p_user_id   uuid
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  update public.answers
  set submitted_at = now()
  where user_id = p_user_id
    and submitted_at is null
    and question_id in (
      select q.id
      from public.questions q
      join public.attributes a on a.id = q.attribute_id
      where a.sample_id = p_sample_id
        and q.round = 'nose'
    );

  insert into public.sample_nosing_submissions (sample_id, user_id)
  values (p_sample_id, p_user_id)
  on conflict (sample_id, user_id) do nothing;
end;
$$;
