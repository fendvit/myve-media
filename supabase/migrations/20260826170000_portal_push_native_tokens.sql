-- Native push goes through FCM, which delivers to a registration token rather
-- than a Web Push endpoint plus an encryption key pair.
--
-- Rather than a second table, `endpoint` becomes the generic delivery address —
-- a push-service URL for web, an FCM token for native — and `platform` tells
-- send-push which transport to use. Its unique constraint keeps deduplicating
-- devices for both kinds, so the existing upsert on conflict (endpoint) is
-- still correct.

alter table public.portal_push_subscriptions
  add column platform text not null default 'web';

alter table public.portal_push_subscriptions
  add constraint portal_push_platform_known
    check (platform in ('web', 'android', 'ios'));

-- Only Web Push encrypts with a per-subscription key pair; FCM has no analogue.
alter table public.portal_push_subscriptions
  alter column p256dh drop not null,
  alter column auth drop not null;

-- Keep the two shapes honest. A web row without keys can't be encrypted and
-- would fail at send time; a native row carrying keys means something wrote the
-- wrong shape and is worth catching at the door rather than in production logs.
alter table public.portal_push_subscriptions
  add constraint portal_push_keys_match_platform check (
    case platform
      when 'web' then p256dh is not null and auth is not null
      else p256dh is null and auth is null
    end
  );

comment on column public.portal_push_subscriptions.endpoint is
  'Delivery address: a Web Push service URL when platform = web, an FCM registration token otherwise.';
