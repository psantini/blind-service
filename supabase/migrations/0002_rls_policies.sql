-- ============================================================
-- Enable RLS on all tables
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.whiskey_types  enable row level security;
alter table public.blinds         enable row level security;
alter table public.blind_members  enable row level security;
alter table public.samples        enable row level security;
alter table public.attributes     enable row level security;
alter table public.questions      enable row level security;
alter table public.sample_reveals enable row level security;
alter table public.answers        enable row level security;


-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

create or replace function public.is_blind_member(p_blind_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.blind_members
    where blind_id = p_blind_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_blind_host(p_blind_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.blind_members
    where blind_id = p_blind_id
      and user_id = auth.uid()
      and role = 'host'
  );
$$;

create or replace function public.has_user_revealed_sample(p_sample_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.sample_reveals
    where sample_id = p_sample_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.blind_id_for_sample(p_sample_id uuid)
returns uuid language sql security definer stable as $$
  select blind_id from public.samples where id = p_sample_id;
$$;

create or replace function public.blind_id_for_question(p_question_id uuid)
returns uuid language sql security definer stable as $$
  select s.blind_id
  from public.questions q
  join public.attributes a on a.id = q.attribute_id
  join public.samples s on s.id = a.sample_id
  where q.id = p_question_id;
$$;

create or replace function public.sample_id_for_question(p_question_id uuid)
returns uuid language sql security definer stable as $$
  select a.sample_id
  from public.questions q
  join public.attributes a on a.id = q.attribute_id
  where q.id = p_question_id;
$$;


-- ============================================================
-- PROFILES
-- ============================================================
create policy "profiles: authenticated users can read all"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles: users can update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());


-- ============================================================
-- WHISKEY TYPES
-- ============================================================
create policy "whiskey_types: authenticated users can read"
  on public.whiskey_types for select
  to authenticated
  using (true);


-- ============================================================
-- BLINDS
-- ============================================================
create policy "blinds: authenticated users can read all"
  on public.blinds for select
  to authenticated
  using (true);

create policy "blinds: authenticated users can create"
  on public.blinds for insert
  to authenticated
  with check (host_id = auth.uid());

create policy "blinds: host can update own blind"
  on public.blinds for update
  to authenticated
  using (host_id = auth.uid());


-- ============================================================
-- BLIND MEMBERS
-- ============================================================
create policy "blind_members: members can read their blind"
  on public.blind_members for select
  to authenticated
  using (public.is_blind_member(blind_id));

create policy "blind_members: authenticated users can join"
  on public.blind_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "blind_members: can leave or host can remove"
  on public.blind_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_blind_host(blind_id)
  );


-- ============================================================
-- SAMPLES
-- ============================================================
create policy "samples: blind members can read"
  on public.samples for select
  to authenticated
  using (public.is_blind_member(blind_id));

create policy "samples: host can insert"
  on public.samples for insert
  to authenticated
  with check (public.is_blind_host(blind_id));

create policy "samples: host can update"
  on public.samples for update
  to authenticated
  using (public.is_blind_host(blind_id));


-- ============================================================
-- ATTRIBUTES
-- Hidden from each participant until they reveal that sample
-- ============================================================
create policy "attributes: host always, others after own reveal"
  on public.attributes for select
  to authenticated
  using (
    public.is_blind_host(public.blind_id_for_sample(sample_id))
    or (
      public.is_blind_member(public.blind_id_for_sample(sample_id))
      and public.has_user_revealed_sample(sample_id)
    )
  );

create policy "attributes: host can insert"
  on public.attributes for insert
  to authenticated
  with check (public.is_blind_host(public.blind_id_for_sample(sample_id)));

create policy "attributes: host can update"
  on public.attributes for update
  to authenticated
  using (public.is_blind_host(public.blind_id_for_sample(sample_id)));


-- ============================================================
-- QUESTIONS
-- ============================================================
create policy "questions: blind members can read"
  on public.questions for select
  to authenticated
  using (
    public.is_blind_member(
      public.blind_id_for_question(id)
    )
  );

create policy "questions: host can insert"
  on public.questions for insert
  to authenticated
  with check (
    public.is_blind_host(
      public.blind_id_for_question(id)
    )
  );


-- ============================================================
-- SAMPLE REVEALS
-- ============================================================
create policy "sample_reveals: blind members can read"
  on public.sample_reveals for select
  to authenticated
  using (
    public.is_blind_member(
      public.blind_id_for_sample(sample_id)
    )
  );

create policy "sample_reveals: participants can insert own"
  on public.sample_reveals for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.is_blind_member(
      public.blind_id_for_sample(sample_id)
    )
  );


-- ============================================================
-- ANSWERS
-- ============================================================
create policy "answers: own always, others after own reveal"
  on public.answers for select
  to authenticated
  using (
    user_id = auth.uid()
    or (
      public.has_user_revealed_sample(
        public.sample_id_for_question(question_id)
      )
      and public.is_blind_member(
        public.blind_id_for_question(question_id)
      )
    )
  );

create policy "answers: participants can insert own"
  on public.answers for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.is_blind_member(
      public.blind_id_for_question(question_id)
    )
  );

create policy "answers: participant edits before submit, host scores after"
  on public.answers for update
  to authenticated
  using (
    (user_id = auth.uid() and submitted_at is null)
    or public.is_blind_host(
      public.blind_id_for_question(question_id)
    )
  );
