-- Two fixes:
-- 1. Inline the host check directly (avoids security-definer auth.uid() issues in storage context)
-- 2. Add a SELECT policy so upsert: true can check for existing objects

drop policy if exists "bottle-images: host can upload"  on storage.objects;
drop policy if exists "bottle-images: host can replace" on storage.objects;
drop policy if exists "bottle-images: host can delete"  on storage.objects;

-- SELECT: authenticated users can read object metadata (public URL reads bypass RLS entirely)
create policy "bottle-images: authenticated can read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'bottle-images');

-- INSERT: inlined check — no security-definer wrapper
create policy "bottle-images: host can upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'bottle-images'
    and exists (
      select 1 from public.blind_members
      where blind_id = split_part(name, '/', 1)::uuid
        and user_id = (select auth.uid())
        and role = 'host'
    )
  );

-- UPDATE: same
create policy "bottle-images: host can replace"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'bottle-images'
    and exists (
      select 1 from public.blind_members
      where blind_id = split_part(name, '/', 1)::uuid
        and user_id = (select auth.uid())
        and role = 'host'
    )
  );

-- DELETE: same
create policy "bottle-images: host can delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'bottle-images'
    and exists (
      select 1 from public.blind_members
      where blind_id = split_part(name, '/', 1)::uuid
        and user_id = (select auth.uid())
        and role = 'host'
    )
  );
