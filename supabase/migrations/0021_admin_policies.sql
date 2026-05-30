-- Set super admin for Paul
update public.profiles
  set is_super_admin = true
  where id = '9d586f00-2911-43be-8543-7019319fb576';

-- Super admin DELETE policies
-- Deleting a blind cascades to all samples, attributes, questions, answers,
-- blind_members, sample_reveals, and sample_nosing_submissions automatically.
create policy "blinds: super admin can delete"
  on public.blinds for delete to authenticated
  using (public.is_super_admin());

create policy "samples: super admin can delete"
  on public.samples for delete to authenticated
  using (public.is_super_admin());

-- answers, sample_reveals, nosing_submissions: needed to reset a user's submission
create policy "answers: super admin can delete"
  on public.answers for delete to authenticated
  using (public.is_super_admin());

create policy "sample_reveals: super admin can delete"
  on public.sample_reveals for delete to authenticated
  using (public.is_super_admin());

create policy "nosing_submissions: super admin can delete"
  on public.sample_nosing_submissions for delete to authenticated
  using (public.is_super_admin());
