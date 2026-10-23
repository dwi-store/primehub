-- Restrict UPPRIME administrator privileges to the two explicitly approved Gmail accounts.
-- Existing users outside this allowlist are demoted; the second approved account
-- will receive admin access automatically when it signs up with the exact Gmail.

CREATE OR REPLACE FUNCTION public.sync_upprime_admin_allowlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  approved_admin boolean;
BEGIN
  approved_admin := lower(coalesce(NEW.email, '')) IN (
    'storedwi446@gmail.com',
    'rizkiamalludin99@gmail.com'
  );

  INSERT INTO public.profiles (id, is_admin)
  VALUES (NEW.id, approved_admin)
  ON CONFLICT (id) DO UPDATE
    SET is_admin = EXCLUDED.is_admin;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_upprime_admin_allowlist() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sync_upprime_admin_allowlist_after_auth_change ON auth.users;
CREATE TRIGGER sync_upprime_admin_allowlist_after_auth_change
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_upprime_admin_allowlist();

-- Immediately reconcile all existing accounts against the allowlist.
UPDATE public.profiles p
SET is_admin = (
  lower(coalesce(u.email, '')) IN (
    'storedwi446@gmail.com',
    'rizkiamalludin99@gmail.com'
  )
)
FROM auth.users u
WHERE u.id = p.id;

-- Ensure profiles exist for the two approved users if they already exist in Auth.
INSERT INTO public.profiles (id, is_admin)
SELECT u.id,
       lower(coalesce(u.email, '')) IN (
         'storedwi446@gmail.com',
         'rizkiamalludin99@gmail.com'
       )
FROM auth.users u
WHERE lower(coalesce(u.email, '')) IN (
  'storedwi446@gmail.com',
  'rizkiamalludin99@gmail.com'
)
ON CONFLICT (id) DO UPDATE
SET is_admin = EXCLUDED.is_admin;
