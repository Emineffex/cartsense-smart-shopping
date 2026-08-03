import { Suspense, lazy, useEffect, useState } from "react";
import { Expand, RotateCw, X } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { usableProductImages, viewerModeFor } from "@/lib/product-image";

// Lazy: the interactive viewer only downloads when a product actually shows it.
const ProductViewer = lazy(() => import("@/components/product-viewer"));

interface ProductGalleryProps {
  product: { image?: string | null; images?: string[] | null; name: string; brand: string };
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const images = usableProductImages(product);
  const mode = viewerModeFor(images);
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    setActive(0);
    setViewer(false);
  }, [product.name]);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  const skeleton = <div className="aspect-square w-full animate-pulse bg-muted" />;

  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
        {viewer && mode !== "none" ? (
          <Suspense fallback={skeleton}>
            <ProductViewer
              images={images.length ? images : [""]}
              alt={product.name}
              mode={mode}
              label={product.brand}
            />
          </Suspense>
        ) : (
          <ProductImage
            src={images[active]}
            alt={product.name}
            label={product.brand}
            eager
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="aspect-square w-full object-cover"
          />
        )}

        {!viewer && (
          <button
            type="button"
            onClick={() => setFull(true)}
            aria-label="Open full-screen preview"
            className="absolute right-3 top-3 rounded-lg border border-border bg-background/90 p-2 text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Expand className="h-4 w-4" />
          </button>
        )}
      </div>

      {mode !== "none" && (
        <button
          type="button"
          onClick={() => setViewer((v) => !v)}
          className={`mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${
            viewer
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background hover:border-primary hover:text-primary"
          }`}
        >
          <RotateCw className="h-4 w-4" />
          {mode === "spin"
            ? viewer
              ? "Exit 360° view"
              : "360° View"
            : viewer
              ? "Exit interactive view"
              : "Interactive view"}
        </button>
      )}

      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => {
                setViewer(false);
                setActive(i);
              }}
              aria-label={`View image ${i + 1}`}
              className={`overflow-hidden rounded-xl border-2 transition-all ${
                i === active && !viewer
                  ? "border-primary shadow-lg shadow-primary/20"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <ProductImage
                src={src}
                alt={`${product.name} view ${i + 1}`}
                label={product.brand}
                className="aspect-square w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {full && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4 animate-fade-in"
          onClick={() => setFull(false)}
        >
          <button
            type="button"
            aria-label="Close preview"
            className="absolute right-5 top-5 rounded-lg border border-border bg-background p-2 text-muted-foreground hover:text-primary"
            onClick={() => setFull(false)}
          >
            <X className="h-4 w-4" />
          </button>
          <div
            className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <Suspense fallback={skeleton}>
              <ProductViewer
                images={images.length ? images : [""]}
                alt={product.name}
                mode={mode === "none" ? "parallax" : mode}
                label={product.brand}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
