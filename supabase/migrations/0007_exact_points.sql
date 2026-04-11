-- Update score_sample_answers to support custom exact match points.
-- When scoring_type = 'exact' and brackets is not null, use brackets[0].points
-- as the exact match point value instead of the hardcoded 3.
-- Standard fixed attributes (distillery, type, finished, finish_type) always
-- have brackets = null, so they continue to award 3 pts.

create or replace function public.score_sample_answers(
  p_sample_id uuid,
  p_user_id   uuid
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  r record;
  v_delta numeric;
  v_points numeric;
  v_bracket jsonb;
  v_host_finished text;
  v_exact_pts numeric;
begin
  select lower(trim(attr.value)) into v_host_finished
  from public.attributes attr
  where attr.sample_id = p_sample_id
    and attr.name = 'finished'
  limit 1;

  for r in
    select
      a.id         as answer_id,
      a.value      as guess,
      attr.value   as actual,
      attr.name    as attr_name,
      attr.scoring_type,
      attr.brackets,
      attr.input_type
    from public.answers a
    join public.questions q on q.id = a.question_id
    join public.attributes attr on attr.id = q.attribute_id
    where attr.sample_id = p_sample_id
      and a.user_id = p_user_id
      and a.submitted_at is not null
  loop
    v_points := 0;

    if r.attr_name = 'finish_type' then
      if v_host_finished is null or v_host_finished != 'yes' then
        update public.answers
        set points_earned = 0, fuzzy_flagged = false
        where id = r.answer_id;
        continue;
      end if;
    end if;

    if r.scoring_type = 'exact' then
      -- Custom exact points: stored as brackets[0].points when not null
      v_exact_pts := 3;
      if r.brackets is not null and jsonb_array_length(r.brackets) > 0 then
        v_exact_pts := (r.brackets->0->>'points')::numeric;
      end if;

      if r.guess is null or r.guess = '' then
        update public.answers
        set points_earned = 0, fuzzy_flagged = false
        where id = r.answer_id;
      elsif lower(trim(r.guess)) = lower(trim(r.actual)) then
        update public.answers
        set points_earned = v_exact_pts, fuzzy_flagged = false
        where id = r.answer_id;
      else
        if r.input_type != 'boolean'
          and r.guess is not null
          and levenshtein(lower(trim(r.guess)), lower(trim(r.actual))) <= 3 then
          update public.answers
          set fuzzy_flagged = true, points_earned = null
          where id = r.answer_id;
        else
          update public.answers
          set points_earned = 0, fuzzy_flagged = false
          where id = r.answer_id;
        end if;
      end if;

    elsif r.scoring_type = 'bracket' then
      if r.guess is null or r.guess = '' then
        update public.answers
        set points_earned = 0, fuzzy_flagged = false
        where id = r.answer_id;
      else
        v_delta := abs(r.guess::numeric - r.actual::numeric);
        v_points := 0;

        for v_bracket in select * from jsonb_array_elements(r.brackets)
        loop
          if v_delta <= (v_bracket->>'max_delta')::numeric then
            v_points := (v_bracket->>'points')::numeric;
            exit;
          end if;
        end loop;

        update public.answers
        set points_earned = v_points, fuzzy_flagged = false
        where id = r.answer_id;
      end if;
    end if;

  end loop;
end;
$$;
