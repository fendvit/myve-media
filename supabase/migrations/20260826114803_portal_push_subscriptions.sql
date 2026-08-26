-- Web Push subscriptions, one row per browser/device per user.
-- The endpoint is the push service URL and is globally unique, which makes it
-- the natural conflict target when a browser re-subscribes.

create table public.portal_push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index portal_push_subscriptions_user_id_idx
  on public.portal_push_subscriptions(user_id);

alter table public.portal_push_subscriptions enable row level security;

-- A user manages only their own devices. The send path runs as the service
-- role, which bypasses RLS, so no cross-user read policy is needed.
create policy portal_push_own_select on public.portal_push_subscriptions
  for select to authenticated
  using (user_id = auth.uid());

create policy portal_push_own_insert on public.portal_push_subscriptions
  for insert to authenticated
  with check (user_id = auth.uid());

create policy portal_push_own_delete on public.portal_push_subscriptions
  for delete to authenticated
  using (user_id = auth.uid());
