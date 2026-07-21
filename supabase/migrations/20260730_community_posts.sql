-- Comunidad conversacional: posts nativos del usuario (texto + foto + tipo) que
-- viven en activity_feed con activity_type='post'. Ejecutar una vez.

-- 1) Permitir al usuario crear/borrar SUS actividades (posts nativos). El SELECT ya
--    existe (autenticados). No había INSERT/DELETE propios para el usuario.
drop policy if exists "users insert own activity" on public.activity_feed;
create policy "users insert own activity" on public.activity_feed
    for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "users delete own activity" on public.activity_feed;
create policy "users delete own activity" on public.activity_feed
    for delete to authenticated using (user_id = auth.uid());

-- 2) Bucket público para las fotos de los posts de comunidad.
insert into storage.buckets (id, name, public)
values ('community-posts', 'community-posts', true)
on conflict (id) do update set public = true;

drop policy if exists "Community post photos are publicly readable" on storage.objects;
create policy "Community post photos are publicly readable"
on storage.objects for select using (bucket_id = 'community-posts');

drop policy if exists "Users can upload own community photos" on storage.objects;
create policy "Users can upload own community photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'community-posts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own community photos" on storage.objects;
create policy "Users can delete own community photos"
on storage.objects for delete to authenticated
using (bucket_id = 'community-posts' and (storage.foldername(name))[1] = auth.uid()::text);
