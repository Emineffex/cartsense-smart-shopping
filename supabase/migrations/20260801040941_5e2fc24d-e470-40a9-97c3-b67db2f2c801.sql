ALTER TABLE public.product_offers
  ADD COLUMN IF NOT EXISTS affiliate_url text,
  ADD COLUMN IF NOT EXISTS canonical_product_url text;

CREATE INDEX IF NOT EXISTS idx_product_offers_affiliate_url ON public.product_offers (affiliate_url) WHERE affiliate_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_offers_canonical_url ON public.product_offers (canonical_product_url) WHERE canonical_product_url IS NOT NULL;