
-- Add Vijay Sales store
INSERT INTO public.stores(name, slug, tagline, affiliate_url, is_active)
VALUES ('Vijay Sales','vijay-sales','Trusted electronics retailer','https://www.vijaysales.com', true)
ON CONFLICT (slug) DO NOTHING;

-- recently_viewed
CREATE TABLE IF NOT EXISTS public.recently_viewed(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recently_viewed TO authenticated;
GRANT ALL ON public.recently_viewed TO service_role;
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recently_viewed" ON public.recently_viewed FOR ALL
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- search_history
CREATE TABLE IF NOT EXISTS public.search_history(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.search_history TO authenticated;
GRANT ALL ON public.search_history TO service_role;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own search_history" ON public.search_history FOR ALL
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- admin_users view (compat wrapper over user_roles)
CREATE OR REPLACE VIEW public.admin_users AS
  SELECT user_id, created_at FROM public.user_roles WHERE role = 'admin';
GRANT SELECT ON public.admin_users TO authenticated;

-- Seed 320 products
WITH seed AS (
  SELECT i,
    (ARRAY['Smartphones','Laptops','Headphones','Televisions','Tablets','Cameras','Smartwatches','Speakers'])[1+((i-1)%8)] AS category,
    (ARRAY['Apple','Samsung','OnePlus','Xiaomi','Sony','LG','Dell','HP','Bose','boAt','JBL','Realme','Asus','Lenovo','Canon','Nikon'])[1+((i*3-1)%16)] AS brand
  FROM generate_series(1,320) i
)
INSERT INTO public.products(id,name,brand,category,image,images,specs,pros,cons,rating,reviews_count,lowest_price,highest_price)
SELECT
  'prod-'||i,
  brand||' '||category||' Series '||i,
  brand, category,
  'https://picsum.photos/seed/cartsense'||i||'/600/600',
  jsonb_build_array(
    'https://picsum.photos/seed/cartsense'||i||'a/600/600',
    'https://picsum.photos/seed/cartsense'||i||'b/600/600',
    'https://picsum.photos/seed/cartsense'||i||'c/600/600'
  ),
  jsonb_build_object('Warranty','1 Year Manufacturer','Color','Assorted','In the Box','Device, Charger, Manual','Category',category,'Brand',brand),
  '["Excellent build quality","Great value for money","Reliable performance"]'::jsonb,
  '["Limited color options","Ships in 3-5 days"]'::jsonb,
  round((3.6 + random()*1.3)::numeric,1),
  (150 + floor(random()*9800))::int,
  0, 0
FROM seed
ON CONFLICT (id) DO NOTHING;

-- Offers: each product × each store
WITH base AS (
  SELECT p.id, (4000 + floor(random()*146000))::numeric AS mrp
  FROM public.products p WHERE p.id LIKE 'prod-%'
),
pairs AS (
  SELECT b.id, b.mrp, s.id AS store_id FROM base b CROSS JOIN public.stores s
)
INSERT INTO public.product_offers(product_id,store_id,price,original_price,discount,rating,reviews,delivery,bank_offer,best_deal,url)
SELECT id, store_id,
  round((mrp * (0.70 + random()*0.25))::numeric, 0),
  mrp,
  (5 + floor(random()*35))::int,
  round((3.8 + random()*1.2)::numeric,1),
  (50 + floor(random()*4950))::int,
  (ARRAY['Free delivery','1-2 days','3-5 days','Same day'])[1+floor(random()*4)::int],
  (ARRAY['10% off with HDFC Cards','5% cashback on ICICI','No Cost EMI available','Extra ₹500 off with Axis',NULL])[1+floor(random()*5)::int],
  false,
  'https://example.com/p/'||id
FROM pairs
ON CONFLICT (product_id,store_id) DO NOTHING;

-- Roll up min/max prices
UPDATE public.products p SET
  lowest_price = agg.mn,
  highest_price = agg.mx
FROM (SELECT product_id, MIN(price) mn, MAX(price) mx FROM public.product_offers GROUP BY product_id) agg
WHERE p.id = agg.product_id;

-- Mark best deals
UPDATE public.product_offers SET best_deal = false WHERE best_deal = true;
UPDATE public.product_offers o SET best_deal = true
FROM (SELECT DISTINCT ON (product_id) product_id, id FROM public.product_offers ORDER BY product_id, price ASC) m
WHERE o.id = m.id;

-- 14 days of price history per offer
INSERT INTO public.price_history(product_id,store_id,price,captured_at)
SELECT o.product_id, o.store_id,
  round((o.price * (0.88 + random()*0.24))::numeric, 0),
  now() - (d || ' days')::interval
FROM public.product_offers o, generate_series(1,14) d
WHERE o.product_id LIKE 'prod-%';

-- Starter coupons
INSERT INTO public.coupons(store_id, code, discount, title, is_active, expires_at)
SELECT id, upper(replace(slug,'-',''))||'10', '10% OFF', 'Save 10% at '||name, true, now() + interval '60 days'
FROM public.stores
ON CONFLICT DO NOTHING;
