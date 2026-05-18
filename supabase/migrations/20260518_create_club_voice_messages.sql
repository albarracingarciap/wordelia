create table if not exists public.club_voice_messages (
    id uuid primary key default gen_random_uuid(),
    club_id uuid not null references public.clubs(id) on delete cascade,
    club_book_id uuid null references public.club_books(id) on delete set null,
    user_id uuid not null references public.profiles(id) on delete cascade,
    checkpoint_index integer null,
    title text null,
    audio_path text null,
    duration_seconds integer null,
    mime_type text not null,
    file_size_bytes integer null,
    upload_status text not null default 'pending'
        check (upload_status in ('pending', 'ready', 'failed')),
    transcript text null,
    transcript_status text not null default 'none'
        check (transcript_status in ('none', 'pending', 'processing', 'ready', 'failed')),
    is_pinned boolean not null default false,
    is_archived boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_club_voice_messages_club_created
on public.club_voice_messages (club_id, created_at desc);

create index if not exists idx_club_voice_messages_checkpoint
on public.club_voice_messages (club_id, club_book_id, checkpoint_index);

create index if not exists idx_club_voice_messages_user
on public.club_voice_messages (user_id);

create index if not exists idx_club_voice_messages_pinned
on public.club_voice_messages (club_id, is_pinned, created_at desc);

alter table public.club_voice_messages enable row level security;

drop policy if exists "Club members can read voice messages" on public.club_voice_messages;
create policy "Club members can read voice messages"
on public.club_voice_messages
for select
to authenticated
using (
    upload_status = 'ready'
    and is_archived = false
    and exists (
        select 1
        from public.club_members
        where club_members.club_id = club_voice_messages.club_id
          and club_members.user_id = auth.uid()
          and club_members.role <> 'pending'
    )
);

drop policy if exists "Club staff can create voice messages" on public.club_voice_messages;
create policy "Club staff can create voice messages"
on public.club_voice_messages
for insert
to authenticated
with check (
    user_id = auth.uid()
    and exists (
        select 1
        from public.club_members
        where club_members.club_id = club_voice_messages.club_id
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
);

drop policy if exists "Club staff can update voice messages" on public.club_voice_messages;
create policy "Club staff can update voice messages"
on public.club_voice_messages
for update
to authenticated
using (
    exists (
        select 1
        from public.club_members
        where club_members.club_id = club_voice_messages.club_id
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
)
with check (
    exists (
        select 1
        from public.club_members
        where club_members.club_id = club_voice_messages.club_id
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
);

drop policy if exists "Club staff can delete voice messages" on public.club_voice_messages;
create policy "Club staff can delete voice messages"
on public.club_voice_messages
for delete
to authenticated
using (
    exists (
        select 1
        from public.club_members
        where club_members.club_id = club_voice_messages.club_id
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
);

insert into storage.buckets (id, name, public)
values ('club-voice-messages', 'club-voice-messages', false)
on conflict (id) do update set public = false;

drop policy if exists "Club members can read voice message audio" on storage.objects;
create policy "Club members can read voice message audio"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'club-voice-messages'
    and exists (
        select 1
        from public.club_voice_messages
        join public.club_members
          on club_members.club_id = club_voice_messages.club_id
        where club_voice_messages.club_id::text = (storage.foldername(name))[1]
          and club_voice_messages.id::text = (storage.foldername(name))[2]
          and club_voice_messages.audio_path = name
          and club_voice_messages.upload_status = 'ready'
          and club_voice_messages.is_archived = false
          and club_members.user_id = auth.uid()
          and club_members.role <> 'pending'
    )
);

drop policy if exists "Club staff can upload voice message audio" on storage.objects;
create policy "Club staff can upload voice message audio"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'club-voice-messages'
    and exists (
        select 1
        from public.club_voice_messages
        join public.club_members
          on club_members.club_id = club_voice_messages.club_id
        where club_voice_messages.club_id::text = (storage.foldername(name))[1]
          and club_voice_messages.id::text = (storage.foldername(name))[2]
          and club_voice_messages.user_id = auth.uid()
          and club_voice_messages.upload_status = 'pending'
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
);

drop policy if exists "Club staff can update voice message audio" on storage.objects;
create policy "Club staff can update voice message audio"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'club-voice-messages'
    and exists (
        select 1
        from public.club_voice_messages
        join public.club_members
          on club_members.club_id = club_voice_messages.club_id
        where club_voice_messages.club_id::text = (storage.foldername(name))[1]
          and club_voice_messages.id::text = (storage.foldername(name))[2]
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
)
with check (
    bucket_id = 'club-voice-messages'
    and exists (
        select 1
        from public.club_voice_messages
        join public.club_members
          on club_members.club_id = club_voice_messages.club_id
        where club_voice_messages.club_id::text = (storage.foldername(name))[1]
          and club_voice_messages.id::text = (storage.foldername(name))[2]
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
);

drop policy if exists "Club staff can delete voice message audio" on storage.objects;
create policy "Club staff can delete voice message audio"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'club-voice-messages'
    and exists (
        select 1
        from public.club_voice_messages
        join public.club_members
          on club_members.club_id = club_voice_messages.club_id
        where club_voice_messages.club_id::text = (storage.foldername(name))[1]
          and club_voice_messages.id::text = (storage.foldername(name))[2]
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
);
