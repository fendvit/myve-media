-- MCP tokens the admin can mint and revoke from the portal UI.
--
-- Until now the MCP server accepted exactly one token, PORTAL_MCP_TOKEN, held as
-- a Supabase secret. That cannot be managed from a browser: setting a secret
-- needs the management API and a personal access token, which the portal has no
-- business holding. So the tokens move into a table instead, and the secret
-- stays only as a fallback for the connection that already exists.
--
-- Only the SHA-256 of a token is stored. The plaintext is generated in the
-- admin's browser and shown once; nothing on the server can recover it, so a
-- leaked database backup does not hand over portal access. `token_hint` is the
-- first few characters, kept in the clear purely so a row is identifiable in a
-- list — it is far too short to narrow down a 256-bit secret.

create table public.portal_mcp_tokens (
  id           uuid primary key default gen_random_uuid(),
  -- What this token is for, e.g. "Vítův notebook". Free text, for humans.
  label        text not null,
  token_hash   text not null unique,
  token_hint   text not null,
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null,
  -- Written by the edge function on each accepted call, so an unused or
  -- forgotten token is visible as such before you decide to revoke it.
  last_used_at timestamptz,
  -- Revoking keeps the row: the point of the screen is partly a history of what
  -- had access and when it stopped. A deleted row would erase that.
  revoked_at   timestamptz
);

-- The hot path is "hash presented by an unauthenticated caller -> live token",
-- run on every single MCP request. The unique constraint on token_hash already
-- indexes it; this partial index keeps the revoked rows out of that lookup.
create index portal_mcp_tokens_live_idx
  on public.portal_mcp_tokens(token_hash)
  where revoked_at is null;

alter table public.portal_mcp_tokens enable row level security;

-- Admin only, and deliberately no client-side policy of any kind: a client has
-- no reason to know these rows exist. The edge function reads them through the
-- service role, which bypasses RLS entirely.
create policy portal_mcp_tokens_admin_all on public.portal_mcp_tokens
  for all to authenticated
  using (public.portal_is_admin())
  with check (public.portal_is_admin());
