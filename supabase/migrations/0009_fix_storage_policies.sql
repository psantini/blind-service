-- Replace storage.foldername() (unreliable across Supabase versions) with
-- split_part(), which extracts the blind ID directly from the path convention
-- {blindId}/{timestamp}.{ext}.

drop policy if exists "bottle-images: host can upload"  on storage.objects;
drop policy if exists "bottle-images: host can replace" on storage.objects;
drop policy if exists "bottle-images: host can delete"  on storage.objects;

create policy "bottle-images: host can upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'bottle-images'
    and public.is_blind_host(split_part(name, '/', 1)::uuid)
  );

create policy "bottle-images: host can replace"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'bottle-images'
    and public.is_blind_host(split_part(name, '/', 1)::uuid)
  );

create policy "bottle-images: host can delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'bottle-images'
    and public.is_blind_host(split_part(name, '/', 1)::uuid)
  );
