-- Attributes that were saved before the round-assignment UI was wired up
-- ended up with no question rows. Backfill a "taste" question for every
-- attribute that has none so participants can see and answer questions.
insert into public.questions (attribute_id, round)
select a.id, 'taste'
from public.attributes a
where not exists (
  select 1 from public.questions q where q.attribute_id = a.id
);
