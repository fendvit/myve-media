-- Archiving a client has to actually revoke their access.
--
-- redeem-code already refuses an archived client's code, but that gate is only
-- crossed once: the whole point of the code flow is that you enter it a single
-- time and the refresh token keeps you signed in from then on. So in practice
-- every client is already holding a live session, and "the code stops working"
-- revokes nothing at all — the archived client's phone keeps showing their
-- projects and chat indefinitely.
--
-- Fixing it in portal_my_client_id() rather than in each policy: every
-- client-side rule in the schema (clients, projects, updates, messages,
-- read state, welcome dismissals, and both storage buckets) is expressed in
-- terms of this one function, so narrowing it here closes all of them at once
-- and cannot be forgotten by a policy added later. The admin path is untouched
-- — portal_is_admin() knows nothing about archiving, so you keep full access to
-- an archived client's history.
--
-- Unarchiving restores access immediately; nothing is destroyed either way.

create or replace function public.portal_my_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.client_id
  from public.portal_profiles p
  join public.portal_clients c on c.id = p.client_id
  where p.user_id = auth.uid()
    and p.role = 'client'
    and c.archived = false;
$$;

comment on function public.portal_my_client_id() is
  'The signed-in client''s id, or null for an admin or an archived client. Returning null is what revokes an archived client''s live session.';
