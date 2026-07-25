ALTER TABLE public.affiliate_clicks
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_session ON public.affiliate_clicks (session_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_provider ON public.affiliate_clicks (provider, clicked_at DESC);