REVOKE EXECUTE ON FUNCTION public.guard_retailer_status() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.guard_store_status() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.owns_store(uuid) FROM public;