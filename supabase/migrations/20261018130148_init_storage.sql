-- NAISA Stylist IA — esquema (aplicado en producción como migración separada)

-- ─────────────────────────────── Storage privado
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('wardrobe', 'wardrobe', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('body', 'body', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "storage: leer propio" on storage.objects for select to authenticated
  using (bucket_id in ('wardrobe','body') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "storage: subir propio" on storage.objects for insert to authenticated
  with check (bucket_id in ('wardrobe','body') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "storage: actualizar propio" on storage.objects for update to authenticated
  using (bucket_id in ('wardrobe','body') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "storage: borrar propio" on storage.objects for delete to authenticated
  using (bucket_id in ('wardrobe','body') and (storage.foldername(name))[1] = (select auth.uid())::text);
