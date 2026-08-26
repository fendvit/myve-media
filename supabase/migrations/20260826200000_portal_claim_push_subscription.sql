-- Registering a device that some other account registered before still failed
-- with "new row violates row-level security policy (USING expression)", even
-- after the UPDATE policy from 20260826180000 allowed the reassignment.
--
-- The UPDATE policy was necessary but not sufficient. `INSERT ... ON CONFLICT
-- DO UPDATE` additionally requires the *conflicting* row to be visible through
-- the SELECT policy, and `portal_push_own_select` restricts that to
-- `user_id = auth.uid()`. A row belonging to whoever used the phone before is
-- invisible, so Postgres refuses the upsert. That is exactly the case this
-- whole flow exists for: one device, two accounts (admin, then a client code).
--
-- Relaxing the SELECT policy is not an option — it would hand every signed-in
-- user the full list of push endpoints and FCM tokens, which are the delivery
-- addresses for everyone's notifications. So the claim runs in a security
-- definer function instead: it bypasses RLS for this one narrow operation and
-- always writes `auth.uid()` as the owner, so a caller can only ever point a
-- device at themselves.
--
-- Holding the endpoint is treated as proof of controlling the device, which is
-- the same assumption the insert policy already makes: it is an unguessable
-- token minted by FCM or the browser's push service and never exposed by any
-- read path above.

create or replace function public.portal_claim_push_subscription(
  p_endpoint   text,
  p_platform   text,
  p_p256dh     text default null,
  p_auth       text default null,
  p_user_agent text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if coalesce(p_endpoint, '') = '' then
    raise exception 'endpoint required' using errcode = '22023';
  end if;

  -- Mirrors portal_push_platform_known rather than trusting the argument; the
  -- table constraint would catch it anyway, but as an opaque 23514 instead of
  -- something the client can show a person.
  if p_platform not in ('web', 'android', 'ios') then
    raise exception 'unknown platform %', p_platform using errcode = '22023';
  end if;

  insert into public.portal_push_subscriptions
    (user_id, endpoint, platform, p256dh, auth, user_agent)
  values
    (uid, p_endpoint, p_platform, p_p256dh, p_auth, p_user_agent)
  on conflict (endpoint) do update
    set user_id    = uid,
        platform   = excluded.platform,
        p256dh     = excluded.p256dh,
        auth       = excluded.auth,
        user_agent = excluded.user_agent;
end;
$$;

-- Postgres grants EXECUTE to PUBLIC on new functions; anonymous callers have no
-- auth.uid() and would only ever hit the exception above, but there is no
-- reason to expose the endpoint at all (Supabase security linter, lint 0028).
revoke execute on function public.portal_claim_push_subscription(text, text, text, text, text)
  from public, anon;

grant execute on function public.portal_claim_push_subscription(text, text, text, text, text)
  to authenticated, service_role;
