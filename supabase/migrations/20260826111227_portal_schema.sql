-- MYVE client portal (portal.myve.media)
-- Tables are prefixed `portal_` because public.projects already exists and holds
-- the marketing-site portfolio — a completely different concept from a client project.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.portal_clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  contact_email text,
  contact_phone text,
  access_code   text not null unique,
  -- synthetic auth user minted on first code redemption
  auth_user_id  uuid unique references auth.users(id) on delete set null,
  archived      boolean not null default false,
  created_at    timestamptz not null default now()
);

create table public.portal_projects (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.portal_clients(id) on delete cascade,
  name        text not null,
  description text,
  -- free-form so you are never boxed in by an enum you have to migrate later
  status      text not null default 'V přípravě',
  progress    int  not null default 0 check (progress between 0 and 100),
  live_url    text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index portal_projects_client_id_idx on public.portal_projects(client_id);

-- The "what's happening" log you post per project.
create table public.portal_updates (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.portal_projects(id) on delete cascade,
  title      text,
  body       text not null,
  created_at timestamptz not null default now()
);

create index portal_updates_project_id_idx on public.portal_updates(project_id, created_at desc);

-- One chat thread per client, shared across all their projects.
create table public.portal_messages (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.portal_clients(id) on delete cascade,
  sender_role    text not null check (sender_role in ('admin', 'client')),
  sender_user_id uuid references auth.users(id) on delete set null,
  body           text,
  attachment_url  text,
  attachment_name text,
  created_at     timestamptz not null default now(),
  read_at        timestamptz,
  constraint portal_messages_not_empty
    check (coalesce(body, '') <> '' or attachment_url is not null)
);

create index portal_messages_client_id_idx on public.portal_messages(client_id, created_at);

-- Maps an auth user to either the admin role or a specific client.
create table public.portal_profiles (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  role      text not null check (role in ('admin', 'client')),
  client_id uuid references public.portal_clients(id) on delete cascade,
  constraint portal_profiles_client_needs_id
    check (role <> 'client' or client_id is not null)
);

create index portal_profiles_client_id_idx on public.portal_profiles(client_id);

-- Brute-force protection for the code gate. Written by the edge function only.
create table public.portal_code_attempts (
  id         bigserial primary key,
  ip         text not null,
  succeeded  boolean not null default false,
  created_at timestamptz not null default now()
);

create index portal_code_attempts_ip_idx on public.portal_code_attempts(ip, created_at desc);

-- ---------------------------------------------------------------------------
-- Access code generation
-- ---------------------------------------------------------------------------

-- 8 chars from a 32-symbol alphabet with no look-alike glyphs (no I/O/0/1).
-- 32^8 ~= 1.1e12 combinations; 256 % 32 == 0 so the byte->symbol map is unbiased.
create or replace function public.portal_generate_code()
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  raw      bytea;
  code     text;
  i        int;
begin
  loop
    raw  := extensions.gen_random_bytes(8);
    code := '';
    for i in 0..7 loop
      code := code || substr(alphabet, (get_byte(raw, i) % 32) + 1, 1);
    end loop;
    code := substr(code, 1, 4) || '-' || substr(code, 5, 4);
    exit when not exists (select 1 from public.portal_clients c where c.access_code = code);
  end loop;
  return code;
end;
$$;

alter table public.portal_clients
  alter column access_code set default public.portal_generate_code();

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------

-- security definer so the policies below can read portal_profiles without
-- recursing into portal_profiles' own RLS.
create or replace function public.portal_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.portal_profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.portal_my_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.client_id from public.portal_profiles p
  where p.user_id = auth.uid() and p.role = 'client';
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.portal_clients       enable row level security;
alter table public.portal_projects      enable row level security;
alter table public.portal_updates       enable row level security;
alter table public.portal_messages      enable row level security;
alter table public.portal_profiles      enable row level security;
alter table public.portal_code_attempts enable row level security;

-- portal_clients: a client sees only its own row; admin sees and writes all.
create policy portal_clients_select on public.portal_clients
  for select to authenticated
  using (public.portal_is_admin() or id = public.portal_my_client_id());

create policy portal_clients_admin_write on public.portal_clients
  for all to authenticated
  using (public.portal_is_admin())
  with check (public.portal_is_admin());

-- portal_projects
create policy portal_projects_select on public.portal_projects
  for select to authenticated
  using (public.portal_is_admin() or client_id = public.portal_my_client_id());

create policy portal_projects_admin_write on public.portal_projects
  for all to authenticated
  using (public.portal_is_admin())
  with check (public.portal_is_admin());

-- portal_updates
create policy portal_updates_select on public.portal_updates
  for select to authenticated
  using (
    public.portal_is_admin()
    or exists (
      select 1 from public.portal_projects pr
      where pr.id = project_id and pr.client_id = public.portal_my_client_id()
    )
  );

create policy portal_updates_admin_write on public.portal_updates
  for all to authenticated
  using (public.portal_is_admin())
  with check (public.portal_is_admin());

-- portal_messages: both sides read the thread; each may only post as itself.
create policy portal_messages_select on public.portal_messages
  for select to authenticated
  using (public.portal_is_admin() or client_id = public.portal_my_client_id());

create policy portal_messages_admin_insert on public.portal_messages
  for insert to authenticated
  with check (public.portal_is_admin() and sender_role = 'admin');

create policy portal_messages_client_insert on public.portal_messages
  for insert to authenticated
  with check (
    client_id = public.portal_my_client_id()
    and sender_role = 'client'
  );

-- Only the admin edits/deletes history; clients cannot rewrite the thread.
create policy portal_messages_admin_update on public.portal_messages
  for update to authenticated
  using (public.portal_is_admin())
  with check (public.portal_is_admin());

create policy portal_messages_admin_delete on public.portal_messages
  for delete to authenticated
  using (public.portal_is_admin());

-- portal_profiles: read-only to its owner; admin reads all. Writes are
-- service-role only (the edge function), so no write policy exists.
create policy portal_profiles_select on public.portal_profiles
  for select to authenticated
  using (user_id = auth.uid() or public.portal_is_admin());

-- portal_code_attempts: no policies at all => only the service role can touch it.

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.portal_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger portal_projects_touch_updated_at
  before update on public.portal_projects
  for each row execute function public.portal_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter table public.portal_messages replica identity full;
alter table public.portal_updates  replica identity full;
alter table public.portal_projects replica identity full;

alter publication supabase_realtime add table public.portal_messages;
alter publication supabase_realtime add table public.portal_updates;
alter publication supabase_realtime add table public.portal_projects;

-- ---------------------------------------------------------------------------
-- Chat attachments bucket (private — served through signed URLs)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('portal-attachments', 'portal-attachments', false)
on conflict (id) do nothing;

-- Objects are stored under `<client_id>/<filename>`, so the first path segment
-- is what authorises access.
create policy portal_attachments_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'portal-attachments'
    and (
      public.portal_is_admin()
      or (storage.foldername(name))[1] = public.portal_my_client_id()::text
    )
  );

create policy portal_attachments_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'portal-attachments'
    and (
      public.portal_is_admin()
      or (storage.foldername(name))[1] = public.portal_my_client_id()::text
    )
  );

create policy portal_attachments_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'portal-attachments'
    and public.portal_is_admin()
  );

-- ---------------------------------------------------------------------------
-- Bootstrap admin profiles
-- ---------------------------------------------------------------------------

-- The existing /admin page already treats any authenticated user as an admin,
-- so mirroring that here is consistent with the current security model.
-- Every auth user that exists today becomes a portal admin; new client users
-- are created by the redeem-code edge function with role 'client'.
insert into public.portal_profiles (user_id, role)
select id, 'admin' from auth.users
on conflict (user_id) do nothing;
