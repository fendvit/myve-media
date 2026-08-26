-- One device can now be subscribed under more than one account.
--
-- `endpoint` being globally unique meant the delivery address belonged to
-- whichever account registered it last. Enable notifications as a client, sign
-- in as admin on the same phone and enable them there, and the single row was
-- reassigned: the client's toggle went back to off and their notifications
-- stopped arriving. Nothing was broken — the row genuinely was the admin's now —
-- but it is not the behaviour anyone expects from a per-account switch, and it
-- is not a test-only situation: one household tablet, or a client who also runs
-- their own agency login, hits exactly the same thing.
--
-- The address is a property of the device, not of the account, so the identity
-- of a subscription is the pair. send-push already selects by user_id and prunes
-- by id, so two rows sharing an endpoint each get their own message and expire
-- independently.

alter table public.portal_push_subscriptions
  drop constraint if exists portal_push_subscriptions_endpoint_key;

create unique index if not exists portal_push_subscriptions_user_endpoint_key
  on public.portal_push_subscriptions (user_id, endpoint);

-- Reassignment no longer exists, so neither should the policy that allowed it.
--
-- It was `using (true) with check (user_id = auth.uid())`, which is a wider hole
-- than it looks: UPDATE does not consult the SELECT policy, so any signed-in
-- user could run `update portal_push_subscriptions set user_id = auth.uid()`
-- with no WHERE clause and take ownership of every device in the table —
-- every client's notifications would have been delivered to them. It was there
-- because the upsert conflicted on somebody else's row; now the conflict target
-- is the caller's own pair and a plain insert policy covers it.
drop policy if exists portal_push_reassign_update on public.portal_push_subscriptions;

-- Same claim as before, but conflicting on (user_id, endpoint): re-enabling on a
-- device this account already registered refreshes the row instead of failing,
-- and a second account on the same device gets a row of its own.
--
-- Still security definer, still writing auth.uid() as the owner. The bypass is
-- no longer strictly required — the conflicting row is now always one the caller
-- can see — but keeping the write behind a function that cannot be told whose
-- device it is registering is worth more than the line it would save.
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
  on conflict (user_id, endpoint) do update
    set platform   = excluded.platform,
        p256dh     = excluded.p256dh,
        auth       = excluded.auth,
        user_agent = excluded.user_agent;
end;
$$;
