-- Reassigning a push token to a different user (the same physical device
-- registering once as a client and once as admin) upserts on the endpoint's
-- unique constraint, which Postgres routes through UPDATE. No UPDATE policy
-- existed, so RLS silently denied it with "USING expression" — the endpoint
-- itself is an unguessable FCM/Web Push token, so treating its presence as
-- proof of device control (like the existing insert policy already does) is
-- safe: only the true owner of the device can ever supply it.

create policy portal_push_reassign_update on public.portal_push_subscriptions
  for update to authenticated
  using (true)
  with check (user_id = auth.uid());
