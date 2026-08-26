-- Unread badges.
--
-- A per-viewer watermark rather than per-message read receipts. portal_messages
-- already has an (unused) read_at column, but marking N rows every time someone
-- opens a thread is N writes to answer one question — "is there anything new?"
-- Two timestamps per viewer per client answer it with a single upsert, and they
-- cover the update log too, which has no per-row read column at all.
--
-- The pair (user_id, client_id) means the admin gets one row per client and a
-- client gets exactly one row. Badges therefore follow the person across
-- devices instead of living in localStorage on one phone.

create table if not exists public.portal_read_state (
  user_id          uuid not null references auth.users(id) on delete cascade,
  client_id        uuid not null references public.portal_clients(id) on delete cascade,
  -- 'epoch' and not now(): a viewer who has never opened a thread has genuinely
  -- seen nothing, so everything in it counts as unread.
  messages_seen_at timestamptz not null default 'epoch',
  updates_seen_at  timestamptz not null default 'epoch',
  primary key (user_id, client_id)
);

alter table public.portal_read_state enable row level security;

-- Your read state is yours: you may only ever see or write your own row, and
-- only for a client you are allowed to see in the first place.
create policy portal_read_state_select on public.portal_read_state
  for select to authenticated
  using (user_id = auth.uid());

create policy portal_read_state_insert on public.portal_read_state
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (public.portal_is_admin() or client_id = public.portal_my_client_id())
  );

create policy portal_read_state_update on public.portal_read_state
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Unread counts
-- ---------------------------------------------------------------------------

-- One round trip for every badge on screen. The admin list would otherwise need
-- a query per client, and PostgREST cannot group on the client side.
--
-- security invoker (the default, stated for the reader): the function must run
-- with the caller's RLS so portal_clients already limits an admin to every
-- client and a client to their own row. Nothing here re-checks identity because
-- nothing here can see past RLS.
create or replace function public.portal_unread_summary()
returns table (
  client_id       uuid,
  unread_messages bigint,
  unread_updates  bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id,
    (
      select count(*)
      from public.portal_messages m
      where m.client_id = c.id
        -- Messages you sent yourself are never unread.
        and m.sender_role <> (case when public.portal_is_admin() then 'admin' else 'client' end)
        and m.created_at > coalesce(rs.messages_seen_at, 'epoch'::timestamptz)
    ),
    (
      select count(*)
      from public.portal_updates u
      join public.portal_projects p on p.id = u.project_id
      where p.client_id = c.id
        -- The admin writes the log, so it is never unread for them.
        and not public.portal_is_admin()
        and u.created_at > coalesce(rs.updates_seen_at, 'epoch'::timestamptz)
    )
  from public.portal_clients c
  left join public.portal_read_state rs
    on rs.client_id = c.id and rs.user_id = auth.uid()
  where c.archived = false;
$$;

-- Mirrors 20260826111433: signed-in users call this, anonymous visitors do not.
revoke execute on function public.portal_unread_summary() from anon;
grant execute on function public.portal_unread_summary() to authenticated;
