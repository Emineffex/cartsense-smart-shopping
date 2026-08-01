UPDATE public.stores SET affiliate_url = 'https://www.amazon.in' WHERE slug = 'amazon' AND affiliate_url IS NULL;
UPDATE public.stores SET affiliate_url = 'https://www.flipkart.com' WHERE slug = 'flipkart' AND affiliate_url IS NULL;
UPDATE public.stores SET affiliate_url = 'https://www.croma.com' WHERE slug = 'croma' AND affiliate_url IS NULL;
UPDATE public.stores SET affiliate_url = 'https://www.reliancedigital.in' WHERE slug = 'reliance-digital' AND affiliate_url IS NULL;

UPDATE public.product_offers o
SET url = CASE s.slug
    WHEN 'amazon' THEN 'https://www.amazon.in/s?k=' || replace(p.name, ' ', '+')
    WHEN 'flipkart' THEN 'https://www.flipkart.com/search?q=' || replace(p.name, ' ', '+')
    WHEN 'croma' THEN 'https://www.croma.com/searchB?q=' || replace(p.name, ' ', '+')
    WHEN 'reliance-digital' THEN 'https://www.reliancedigital.in/search?q=' || replace(p.name, ' ', '+')
    WHEN 'vijay-sales' THEN 'https://www.vijaysales.com/search/' || replace(p.name, ' ', '+')
    ELSE o.url
  END,
  updated_at = now()
FROM public.stores s, public.products p
WHERE s.id = o.store_id
  AND p.id = o.product_id
  AND (o.url IS NULL OR o.url = '' OR o.url = '#' OR o.url ILIKE '%example.com%');