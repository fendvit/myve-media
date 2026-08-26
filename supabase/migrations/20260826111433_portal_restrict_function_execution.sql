-- Postgres grants EXECUTE to PUBLIC on new functions, which exposed all three
-- portal helpers as REST RPC endpoints callable by the anonymous role
-- (flagged by the Supabase security linter, lint 0028). None of them should be
-- reachable without a session.
--
-- `authenticated` must keep EXECUTE: portal_is_admin() and portal_my_client_id()
-- are called from inside RLS policies, which are evaluated with the querying
-- role's privileges, and portal_generate_code() backs the access_code column
-- default used by admin inserts. Revoking it from authenticated would break
-- both. Each function only ever discloses the caller's own role/client, so
-- authenticated access is not a leak.

revoke execute on function public.portal_generate_code() from public, anon;
revoke execute on function public.portal_is_admin()      from public, anon;
revoke execute on function public.portal_my_client_id()  from public, anon;

grant execute on function public.portal_generate_code() to authenticated, service_role;
grant execute on function public.portal_is_admin()      to authenticated, service_role;
grant execute on function public.portal_my_client_id()  to authenticated, service_role;
