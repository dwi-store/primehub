-- Automatically create a non-admin profile whenever a Supabase Auth user is created.
-- Existing profiles are preserved; existing Auth users are backfilled below.

create or replace function public.handle_primehub_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', '')
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_primehub_new_auth_user()
  from public, anon, authenticated;

drop trigger if exists on_primehub_auth_user_created on auth.users;
create trigger on_primehub_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_primehub_new_auth_user();

-- Backfill profiles for Auth users that existed before this migration.
-- No existing admin role is overwritten.
insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'display_name', ''),
    nullif(u.raw_user_meta_data ->> 'full_name', '')
  )
from auth.users u
on conflict (id) do nothing;
