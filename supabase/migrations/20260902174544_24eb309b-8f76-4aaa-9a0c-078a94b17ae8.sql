CREATE OR REPLACE FUNCTION public.register_retailer(
  _business_name text,
  _owner_name text,
  _phone text DEFAULT NULL,
  _address text DEFAULT NULL,
  _gstin text DEFAULT NULL,
  _logo_url text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  base text;
  slug text;
  n int := 0;
  sid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _business_name IS NULL OR length(trim(_business_name)) < 2 THEN
    RAISE EXCEPTION 'Business name is required';
  END IF;

  SELECT store_id INTO sid FROM public.retailer_profiles WHERE user_id = uid;
  IF FOUND AND sid IS NOT NULL THEN RETURN sid; END IF;

  base := regexp_replace(lower(trim(_business_name)), '[^a-z0-9]+', '-', 'g');
  base := trim(both '-' from base);
  IF base = '' THEN base := 'retailer'; END IF;
  slug := base;
  WHILE EXISTS (SELECT 1 FROM public.stores WHERE stores.slug = slug) LOOP
    n := n + 1;
    slug := base || '-' || n;
  END LOOP;

  INSERT INTO public.stores(name, slug, tagline, is_active, is_retailer, verification_status, owner_user_id, logo_url)
  VALUES (trim(_business_name), slug, 'Independent retailer', true, true, 'pending', uid, _logo_url)
  RETURNING id INTO sid;

  INSERT INTO public.retailer_profiles(user_id, store_id, business_name, owner_name, phone, address, gstin, logo_url, verification_status)
  VALUES (uid, sid, trim(_business_name), _owner_name, _phone, _address, _gstin, _logo_url, 'pending')
  ON CONFLICT (user_id) DO UPDATE SET store_id = EXCLUDED.store_id;

  INSERT INTO public.user_roles(user_id, role) VALUES (uid, 'retailer')
  ON CONFLICT DO NOTHING;

  RETURN sid;
END; $$;

REVOKE EXECUTE ON FUNCTION public.register_retailer(text,text,text,text,text,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.register_retailer(text,text,text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_retailer_status(_profile_id uuid, _status text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _status NOT IN ('pending','approved','rejected','suspended') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  UPDATE public.retailer_profiles SET verification_status = _status
   WHERE id = _profile_id RETURNING store_id INTO sid;
  IF sid IS NOT NULL THEN
    UPDATE public.stores SET verification_status = _status WHERE id = sid;
  END IF;
  RETURN true;
END; $$;

REVOKE EXECUTE ON FUNCTION public.set_retailer_status(uuid,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.set_retailer_status(uuid,text) TO authenticated;