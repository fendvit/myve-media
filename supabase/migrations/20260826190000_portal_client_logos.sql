-- Per-client branding: the portal header shows the client's own logo with a
-- small "by MYVE" line under it, so the app reads as theirs rather than ours.

alter table public.portal_clients
  add column logo_url text;

comment on column public.portal_clients.logo_url is
  'Public URL of the client logo in the portal-logos bucket. Null falls back to the MYVE wordmark.';

-- ---------------------------------------------------------------------------
-- Logo bucket
-- ---------------------------------------------------------------------------

-- Public, unlike portal-attachments: a logo is a brand asset the client already
-- shows the world, and a public URL means the header renders without a signed
-- URL round trip on every load — including inside the native app.
insert into storage.buckets (id, name, public)
values ('portal-logos', 'portal-logos', true)
on conflict (id) do nothing;

-- Only the admin uploads or replaces a logo; reads come from the bucket being
-- public, so no select policy is needed for it.
create policy portal_logos_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portal-logos' and public.portal_is_admin());

create policy portal_logos_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'portal-logos' and public.portal_is_admin())
  with check (bucket_id = 'portal-logos' and public.portal_is_admin());

create policy portal_logos_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'portal-logos' and public.portal_is_admin());
