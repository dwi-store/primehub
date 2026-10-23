-- Harden the admin-check helper so it runs with the caller's privileges.
-- This function only checks the authenticated user's own profile and does not need SECURITY DEFINER.
ALTER FUNCTION public.is_primehub_admin() SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.is_primehub_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_primehub_admin() TO authenticated;
