-- Fix cartesian product bug: blind_members × answers was multiplying
-- points by the number of blinds a user is in.
-- Now computes blind stats and answer stats in separate CTEs.
create or replace view public.all_time_stats as
with answer_stats as (
  select
    a.user_id,
    coalesce(sum(a.points_earned), 0)                                        as total_points,
    coalesce(avg(a.points_earned), 0)                                        as avg_points_per_answer,
    coalesce(sum(a.points_earned) filter (where q.round = 'nose'), 0)        as total_nose_points,
    coalesce(sum(a.points_earned) filter (where q.round = 'taste'), 0)       as total_taste_points
  from public.answers a
  join public.questions q on q.id = a.question_id
  where a.points_earned is not null
  group by a.user_id
),
blind_stats as (
  select
    bm.user_id,
    count(distinct bm.blind_id)                                              as blinds_participated,
    count(distinct b.id) filter (where b.host_id = bm.user_id)              as blinds_hosted
  from public.blind_members bm
  join public.blinds b on b.id = bm.blind_id
  group by bm.user_id
)
select
  p.id                                          as user_id,
  p.discord_username,
  p.discord_avatar_url,
  coalesce(bs.blinds_participated, 0)           as blinds_participated,
  coalesce(bs.blinds_hosted, 0)                 as blinds_hosted,
  coalesce(ans.total_points, 0)                 as total_points,
  coalesce(ans.avg_points_per_answer, 0)        as avg_points_per_answer,
  coalesce(ans.total_nose_points, 0)            as total_nose_points,
  coalesce(ans.total_taste_points, 0)           as total_taste_points
from public.profiles p
left join blind_stats bs  on bs.user_id  = p.id
left join answer_stats ans on ans.user_id = p.id;
