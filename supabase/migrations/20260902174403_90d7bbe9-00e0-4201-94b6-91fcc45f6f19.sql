-- stores: retailer ownership
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS is_retailer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'approved';

CREATE INDEX IF NOT EXISTS idx_stores_owner ON public.stores(owner_user_id);

-- products: description + creator
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_created_by ON public.products(created_by);

-- offers: inventory
ALTER TABLE public.product_offers
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS availability text NOT NULL DEFAULT 'in_stock',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_offers_store ON public.product_offers(store_id);

-- retailer profiles
CREATE TABLE IF NOT EXISTS public.retailer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  business_name text NOT NULL,
  owner_name text NOT NULL,
  phone text,
  address text,
  gstin text,
  logo_url text,
  verification_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.retailer_profiles TO authenticated;
GRANT ALL ON public.retailer_profiles TO service_role;
ALTER TABLE public.retailer_profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_retailer_profiles_updated BEFORE UPDATE ON public.retailer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Retailers read own profile" ON public.retailer_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Retailers create own profile" ON public.retailer_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND verification_status = 'pending');

CREATE POLICY "Retailers update own profile" ON public.retailer_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND verification_status = (SELECT rp.verification_status FROM public.retailer_profiles rp WHERE rp.id = retailer_profiles.id)
  );

CREATE POLICY "Admins manage retailer profiles" ON public.retailer_profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- helper: does the current user own this store (and is approved)?
CREATE OR REPLACE FUNCTION public.owns_store(_store_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = _store_id AND s.owner_user_id = auth.uid()
  )
$$;
REVOKE EXECUTE ON FUNCTION public.owns_store(uuid) FROM anon;

-- helper: is this store publicly visible?
CREATE OR REPLACE FUNCTION public.store_is_public(_store_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = _store_id
      AND s.is_active
      AND (NOT s.is_retailer OR s.verification_status = 'approved')
  )
$$;

-- retailer store management
CREATE POLICY "Retailers create own store" ON public.stores
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() AND is_retailer AND verification_status = 'pending');

CREATE POLICY "Retailers update own store" ON public.stores
  FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- products: retailer create/update own
GRANT INSERT, UPDATE ON public.products TO authenticated;

CREATE POLICY "Retailers create products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Retailers update own products" ON public.products
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- offers: restrict public read to visible stores, allow retailer CRUD on own store
GRANT INSERT, UPDATE, DELETE ON public.product_offers TO authenticated;

DROP POLICY IF EXISTS "Offers public read" ON public.product_offers;
CREATE POLICY "Offers public read" ON public.product_offers
  FOR SELECT TO anon, authenticated
  USING (is_active AND public.store_is_public(store_id));

CREATE POLICY "Retailers read own offers" ON public.product_offers
  FOR SELECT TO authenticated
  USING (public.owns_store(store_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Retailers insert own offers" ON public.product_offers
  FOR INSERT TO authenticated
  WITH CHECK (public.owns_store(store_id));

CREATE POLICY "Retailers update own offers" ON public.product_offers
  FOR UPDATE TO authenticated
  USING (public.owns_store(store_id))
  WITH CHECK (public.owns_store(store_id));

CREATE POLICY "Retailers delete own offers" ON public.product_offers
  FOR DELETE TO authenticated
  USING (public.owns_store(store_id));

-- price history: retailers append for their own store
GRANT INSERT ON public.price_history TO authenticated;

CREATE POLICY "Retailers append own price history" ON public.price_history
  FOR INSERT TO authenticated
  WITH CHECK (public.owns_store(store_id));