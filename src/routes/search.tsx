import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AnimatedBackground } from "@/components/animated-background";
import { SearchBar } from "@/components/search-bar";
import { ProductCard } from "@/components/product-card";
import { categories, brands, type Product, type Store, type StorePrice } from "@/lib/sample-data";
import { useProviderSearch } from "@/services/providers";
import type { MergedProduct } from "@/services/providers";
import { logSearch } from "@/services/telemetry";
import { useAuth } from "@/hooks/use-auth";

// Adapt merged provider results to the existing UI `Product` shape so
// ProductCard / Compare / Details keep working with zero UI changes.
function toProduct(m: MergedProduct): Product {
  const stores: StorePrice[] = m.offers.map((o, i) => ({
    store: o.store as Store,
    storeId: o.storeId,
    price: o.price,
    originalPrice: o.originalPrice,
    discount: o.originalPrice > 0 ? Math.round(((o.originalPrice - o.price) / o.originalPrice) * 100) : 0,
    rating: o.rating,
    reviews: o.reviewCount,
    delivery: o.deliveryTime,
    bankOffer: o.bankOffers[0]?.description ?? "",
    bestDeal: i === 0,
    url: o.productUrl,
  }));
  return {
    id: m.key,
    name: m.title,
    brand: m.brand,
    category: m.category,
    image: m.image,
    images: m.images,
    lowestPrice: m.lowestPrice,
    highestPrice: m.highestPrice,
    rating: m.rating,
    reviews: m.reviewCount,
    specs: m.specifications,
    pros: [],
    cons: [],
    stores,
    createdAt: null,
  };
}

type SearchParams = { q?: string };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s.q === "string" ? s.q : "",
  }),
  head: () => ({
    meta: [
      { title: "Search products — CartSense" },
      { name: "description", content: "Search millions of products and compare live prices across India's top online stores." },
    ],
  }),
  component: SearchPage,
});

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "discount", label: "Biggest Discount" },
  { value: "newest", label: "Newest" },
];

function SearchPage() {
  const { q } = Route.useSearch();
  const [category, setCategory] = useState("All");
  const [brand, setBrand] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("relevance");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: products = [], isLoading, isError, refetch } = useProducts({ q, category, brand });
  const { user } = useAuth();
  useEffect(() => {
    if (q && q.trim()) logSearch(q, products.length, user?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (p.lowestPrice < priceRange[0] || p.lowestPrice > priceRange[1]) return false;
      if (p.rating < minRating) return false;
      if (inStockOnly && p.stores.length === 0) return false;
      return true;
    });
    switch (sort) {
      case "price-asc": list = [...list].sort((a, b) => a.lowestPrice - b.lowestPrice); break;
      case "price-desc": list = [...list].sort((a, b) => b.lowestPrice - a.lowestPrice); break;
      case "rating": list = [...list].sort((a, b) => b.rating - a.rating); break;
      case "discount":
        list = [...list].sort((a, b) => {
          const da = (a.highestPrice - a.lowestPrice) / a.highestPrice;
          const db = (b.highestPrice - b.lowestPrice) / b.highestPrice;
          return db - da;
        });
        break;
      case "newest":
        list = [...list].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        break;
    }
    return list;
  }, [products, priceRange, minRating, inStockOnly, sort]);

  const toggleBrand = (b: string) =>
    setBrand((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <SearchBar initial={q ?? ""} size="md" />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar filters */}
          <aside
            className={`${filtersOpen ? "fixed inset-0 z-40 overflow-y-auto bg-background p-4" : "hidden"} lg:relative lg:z-auto lg:block lg:w-72 lg:shrink-0 lg:bg-transparent lg:p-0`}
          >
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={() => setFiltersOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-6 rounded-2xl border border-border bg-card p-5">
              <FilterSection title="Category">
                <div className="space-y-1.5">
                  {categories.map((c) => (
                    <label key={c} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={category === c}
                        onChange={() => setCategory(c)}
                        className="accent-primary"
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Brand">
                <div className="space-y-1.5">
                  {brands.map((b) => (
                    <label key={b} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={brand.includes(b)}
                        onChange={() => toggleBrand(b)}
                        className="accent-primary"
                      />
                      {b}
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Price Range">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>₹{priceRange[0].toLocaleString()}</span>
                  <span className="ml-auto">₹{priceRange[1].toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200000}
                  step={1000}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                  className="mt-2 w-full accent-primary"
                />
              </FilterSection>

              <FilterSection title="Minimum Rating">
                <div className="flex gap-2">
                  {[0, 3, 4, 4.5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(r)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        minRating === r ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                      }`}
                    >
                      {r === 0 ? "Any" : `${r}★+`}
                    </button>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Availability">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="accent-primary"
                  />
                  In stock only
                </label>
              </FilterSection>
            </div>
          </aside>

          {/* Results */}
          <div className="min-w-0 flex-1">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold">
                  {q ? <>Results for "<span className="text-brand-gradient">{q}</span>"</> : "All products"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isLoading ? "Searching…" : `${filtered.length} products found`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </button>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>Sort: {o.label}</option>
                  ))}
                </select>
                <Link
                  to="/compare"
                  className="hidden sm:inline-flex rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-brand-foreground"
                >
                  Compare
                </Link>
              </div>
            </div>

            {isError ? (
              <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 p-16 text-center">
                <p className="font-semibold">Couldn't load products</p>
                <p className="mt-1 text-sm text-muted-foreground">Please check your connection and try again.</p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 inline-flex rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-brand-foreground"
                >
                  Retry
                </button>
              </div>
            ) : isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 animate-pulse rounded-2xl border border-border bg-card/50" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
                <p className="font-semibold">No products match your filters</p>
                <p className="mt-1 text-sm text-muted-foreground">Try widening the price range or clearing filters.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      {children}
    </div>
  );
}
