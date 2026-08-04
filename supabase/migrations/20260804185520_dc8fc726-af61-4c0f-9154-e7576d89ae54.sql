ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS model_url text,
  ADD COLUMN IF NOT EXISTS model_poster_url text;

CREATE INDEX IF NOT EXISTS products_model_url_idx ON public.products (model_url) WHERE model_url IS NOT NULL;