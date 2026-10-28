-- Change requests: the client writes what they want changed on their project,
-- the admin moves it through a status and can answer with a note.
--
-- Separate from the chat on purpose. A request asked in the chat scrolls away
-- under the next ten messages; here it stays on a list with a status until it
-- is done, and the client sees where it stands without asking.

create table public.portal_change_requests (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.portal_clients(id) on delete cascade,
  project_id  uuid references public.portal_projects(id) on delete set null,
  body        text not null check (char_length(btrim(body)) between 1 and 4000),
  status      text not null default 'new'
              check (status in ('new', 'in_progress', 'done', 'declined')),
  admin_note  text check (admin_note is null or char_length(admin_note) <= 2000),
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index portal_change_requests_client_idx
  on public.portal_change_requests (client_id, created_at desc);

-- Explicit grants: Supabase no longer grants Data API access to new tables.
grant select, insert, update, delete on public.portal_change_requests to authenticated, service_role;

alter table public.portal_change_requests enable row level security;

create policy portal_change_requests_select on public.portal_change_requests
  for select to authenticated
  using (public.portal_is_admin() or client_id = public.portal_my_client_id());

-- A client files a request for their own account, always as "new" and without
-- an answer — the status and the note are the admin's.
create policy portal_change_requests_client_insert on public.portal_change_requests
  for insert to authenticated
  with check (
    client_id = public.portal_my_client_id()
    and status = 'new'
    and admin_note is null
    and (
      project_id is null
      or exists (
        select 1 from public.portal_projects pr
        where pr.id = project_id and pr.client_id = public.portal_my_client_id()
      )
    )
  );

create policy portal_change_requests_admin_write on public.portal_change_requests
  for all to authenticated
  using (public.portal_is_admin())
  with check (public.portal_is_admin());

create trigger portal_change_requests_touch_updated_at
  before update on public.portal_change_requests
  for each row execute function public.portal_touch_updated_at();

alter table public.portal_change_requests replica identity full;
alter publication supabase_realtime add table public.portal_change_requests;
