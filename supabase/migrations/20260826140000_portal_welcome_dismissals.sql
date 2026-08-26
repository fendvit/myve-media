-- "How this page works" welcome notice.
--
-- Every project starts by showing the client a short explainer above its
-- content. It is not stored as a portal_updates row: it is not a report, it
-- would sit in the feed forever, and the admin would have to remember to write
-- it on every new project. Instead the client app renders it for any project
-- that has no dismissal row here, so a freshly created project gets it for free.
--
-- Keyed by (user_id, project_id) rather than a boolean on portal_projects for
-- two reasons: portal_projects is admin-write only under RLS, and a dismissal
-- is a fact about a person, not about the project. Same reasoning as
-- portal_read_state — closing it on the phone also closes it in the browser.

create table if not exists public.portal_welcome_dismissals (
  user_id      uuid not null references auth.users(id) on delete cascade,
  project_id   uuid not null references public.portal_projects(id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

alter table public.portal_welcome_dismissals enable row level security;

-- Your dismissals are yours: you only ever see or write your own rows, and only
-- for a project you are allowed to see in the first place.
create policy portal_welcome_dismissals_select on public.portal_welcome_dismissals
  for select to authenticated
  using (user_id = auth.uid());

create policy portal_welcome_dismissals_insert on public.portal_welcome_dismissals
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      public.portal_is_admin()
      or exists (
        select 1 from public.portal_projects p
        where p.id = project_id and p.client_id = public.portal_my_client_id()
      )
    )
  );

-- No update or delete policy: a dismissal is final, which is exactly the
-- promised behaviour ("close it once and it never comes back"). Undoing one is
-- a service-role operation.
