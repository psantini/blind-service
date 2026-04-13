-- ============================================================
-- Storage RLS — bottle-images bucket
-- Public bucket: reads via public URL bypass RLS entirely.
-- Writes (INSERT/UPDATE) require explicit policies.
-- Path convention: {blindId}/{timestamp}.{ext}
-- ============================================================

create policy "bottle-images: host can upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'bottle-images'
    and public.is_blind_host((storage.foldername(name))[1]::uuid)
  );

create policy "bottle-images: host can replace"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'bottle-images'
    and public.is_blind_host((storage.foldername(name))[1]::uuid)
  );

create policy "bottle-images: host can delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'bottle-images'
    and public.is_blind_host((storage.foldername(name))[1]::uuid)
  );
