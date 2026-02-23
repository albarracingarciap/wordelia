-- Modificar la foreign key de activity_feed para apuntar a public.profiles
-- en lugar de auth.users, ya que PostgREST no permite hacer JOIN directo
-- con auth.users por seguridad sin vistas intermedias.

ALTER TABLE public.activity_feed
DROP CONSTRAINT activity_feed_user_id_fkey,
ADD CONSTRAINT activity_feed_user_id_fkey
   FOREIGN KEY (user_id)
   REFERENCES public.profiles(id)
   ON DELETE CASCADE;

-- Lo mismo para activity_likes
ALTER TABLE public.activity_likes
DROP CONSTRAINT activity_likes_user_id_fkey,
ADD CONSTRAINT activity_likes_user_id_fkey
   FOREIGN KEY (user_id)
   REFERENCES public.profiles(id)
   ON DELETE CASCADE;
