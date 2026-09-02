CREATE OR REPLACE FUNCTION public.sync_offer_derived()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    pid := OLD.product_id;
  ELSE
    pid := NEW.product_id;
    IF TG_OP = 'INSERT' OR NEW.price IS DISTINCT FROM OLD.price THEN
      INSERT INTO public.price_history(product_id, store_id, price)
      VALUES (NEW.product_id, NEW.store_id, NEW.price);
    END IF;
  END IF;

  UPDATE public.products p
  SET lowest_price = COALESCE(agg.lo, 0), highest_price = COALESCE(agg.hi, 0)
  FROM (
    SELECT MIN(price) AS lo, MAX(price) AS hi
    FROM public.product_offers o WHERE o.product_id = pid AND o.is_active
  ) agg
  WHERE p.id = pid;

  RETURN NULL;
END; $$;
REVOKE EXECUTE ON FUNCTION public.sync_offer_derived() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS trg_sync_offer_derived ON public.product_offers;
CREATE TRIGGER trg_sync_offer_derived
AFTER INSERT OR UPDATE OR DELETE ON public.product_offers
FOR EACH ROW EXECUTE FUNCTION public.sync_offer_derived();