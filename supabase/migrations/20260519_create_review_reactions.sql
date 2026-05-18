create table if not exists public.review_reactions (
    review_id uuid not null references public.reviews(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    reaction_type text not null default 'helpful' check (reaction_type in ('helpful')),
    created_at timestamptz not null default now(),
    primary key (review_id, user_id, reaction_type)
);

create index if not exists idx_review_reactions_review
on public.review_reactions (review_id, reaction_type);

create index if not exists idx_review_reactions_user
on public.review_reactions (user_id, created_at desc);

alter table public.review_reactions enable row level security;

drop policy if exists "Review reactions are viewable by everyone" on public.review_reactions;
create policy "Review reactions are viewable by everyone"
on public.review_reactions
for select
using (true);

drop policy if exists "Users can mark reviews helpful" on public.review_reactions;
create policy "Users can mark reviews helpful"
on public.review_reactions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can remove own review reactions" on public.review_reactions;
create policy "Users can remove own review reactions"
on public.review_reactions
for delete
to authenticated
using (auth.uid() = user_id);
