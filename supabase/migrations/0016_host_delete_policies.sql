-- No DELETE policies existed on attributes or samples, so every host delete
-- was silently blocked by RLS. Re-saving a sample would skip the delete and
-- insert new attribute rows on top of the old ones, doubling them up.

create policy "attributes: host can delete"
  on public.attributes for delete
  to authenticated
  using (
    public.is_blind_host(
      public.blind_id_for_sample(sample_id)
    )
  );

create policy "samples: host can delete"
  on public.samples for delete
  to authenticated
  using (
    public.is_blind_host(blind_id)
  );
