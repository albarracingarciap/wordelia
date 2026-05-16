alter table public.polls
add column if not exists ended_at timestamp with time zone;

comment on column public.polls.ended_at is 'When the poll was closed. Closed polls stay visible in the club poll history.';
