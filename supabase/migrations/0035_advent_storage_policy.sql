-- Contributors upload bottle photos client-side during submission.
-- Scope the policy to paths containing /advent/ so it doesn't widen
-- the existing host-upload permission for regular blind sample images.
create policy "bottle-images: contributors can upload advent photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'bottle-images'
    and name like '%/advent/%'
  );
