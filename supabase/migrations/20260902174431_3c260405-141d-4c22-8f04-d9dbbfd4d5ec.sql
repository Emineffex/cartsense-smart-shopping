DROP POLICY IF EXISTS "Retailers update own profile" ON public.retailer_profiles;
CREATE POLICY "Retailers update own profile" ON public.retailer_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.guard_retailer_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.verification_status := OLD.verification_status;
  END IF;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_retailer_status ON public.retailer_profiles;
CREATE TRIGGER trg_guard_retailer_status BEFORE UPDATE ON public.retailer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_retailer_status();

CREATE OR REPLACE FUNCTION public.guard_store_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.verification_status := OLD.verification_status;
  END IF;
  NEW.owner_user_id := OLD.owner_user_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_store_status ON public.stores;
CREATE TRIGGER trg_guard_store_status BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.guard_store_status();

DROP POLICY IF EXISTS "Stores public read" ON public.stores;
CREATE POLICY "Stores public read" ON public.stores
  FOR SELECT TO anon, authenticated
  USING (NOT is_retailer OR verification_status = 'approved');

CREATE POLICY "Retailers read own store" ON public.stores
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));