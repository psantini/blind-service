create or replace view public.all_time_stats as
select
  p.id                                          as user_id,
  p.discord_username,
  p.discord_avatar_url,
  count(distinct bm.blind_id)                   as blinds_participated,
  count(distinct b.id) filter (
    where b.host_id = p.id
  )                                             as blinds_hosted,
  coalesce(sum(a.points_earned), 0)             as total_points,
  coalesce(avg(a.points_earned), 0)             as avg_points_per_answer,
  coalesce(sum(a.points_earned) filter (
    where q.round = 'nose'
  ), 0)                                         as total_nose_points,
  coalesce(sum(a.points_earned) filter (
    where q.round = 'taste'
  ), 0)                                         as total_taste_points
from public.profiles p
left join public.blind_members bm on bm.user_id = p.id
left join public.blinds b on b.id = bm.blind_id
left join public.answers a on a.user_id = p.id
  and a.points_earned is not null
left join public.questions q on q.id = a.question_id
group by p.id, p.discord_username, p.discord_avatar_url;
