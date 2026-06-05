-- Super-admin flag on profiles. Set manually in the Supabase dashboard or via:
--   UPDATE profiles SET is_super_admin = true WHERE id = '<your-user-id>';
alter table public.profiles
  add column is_super_admin boolean not null default false;

-- Helper for RLS policies: returns true if the calling user is a super admin.
create or replace function public.is_super_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select is_super_admin from public.profiles where id = auth.uid()),
    false
  );
$$;
