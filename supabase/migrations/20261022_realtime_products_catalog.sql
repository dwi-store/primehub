-- Keep the public storefront synchronized with products created or edited in Admin.
-- Public subscribers still see only rows allowed by products RLS policies.
alter publication supabase_realtime add table public.products;
