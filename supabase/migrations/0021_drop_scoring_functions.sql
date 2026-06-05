-- Scoring logic moved to TypeScript (src/lib/scoring.ts).
-- These SQL functions are no longer called.
drop function if exists public.rescore_sample(uuid);
drop function if exists public.score_sample_answers(uuid, uuid);
drop function if exists public.submit_sample(uuid, uuid);
drop function if exists public.submit_nosing(uuid, uuid);
