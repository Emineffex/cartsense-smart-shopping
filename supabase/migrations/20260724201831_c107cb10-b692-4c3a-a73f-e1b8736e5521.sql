
CREATE TABLE public.affiliate_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.product_offers(id) ON DELETE SET NULL,
  destination_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_affiliate_clicks_store ON public.affiliate_clicks(store_id, created_at DESC);
CREATE INDEX idx_affiliate_clicks_product ON public.affiliate_clicks(product_id, created_at DESC);
CREATE INDEX idx_affiliate_clicks_user ON public.affiliate_clicks(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.affiliate_clicks TO authenticated;
GRANT INSERT ON public.affiliate_clicks TO anon;
GRANT ALL ON public.affiliate_clicks TO service_role;

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log affiliate clicks"
  ON public.affiliate_clicks FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Admins can view all affiliate clicks"
  ON public.affiliate_clicks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.provider_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  products_synced INTEGER NOT NULL DEFAULT 0,
  offers_synced INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_provider_sync_logs_provider ON public.provider_sync_logs(provider, started_at DESC);
CREATE INDEX idx_provider_sync_logs_status ON public.provider_sync_logs(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_sync_logs TO authenticated;
GRANT ALL ON public.provider_sync_logs TO service_role;

ALTER TABLE public.provider_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync logs"
  ON public.provider_sync_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage sync logs"
  ON public.provider_sync_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
