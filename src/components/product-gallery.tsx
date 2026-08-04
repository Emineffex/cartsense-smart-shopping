import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Box, Expand, Images, RotateCw, X } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { viewerModeFor } from "@/lib/product-image";
import { prefetchImages, resolveProductMedia, shouldAutoLoadModel } from "@/lib/product-media";

// Lazy: neither the pseudo-360 viewer nor three.js downloads until it is used.
const ProductViewer = lazy(() => import("@/components/product-viewer"));
const ModelViewer = lazy(() => import("@/components/model-viewer"));

interface ProductGalleryProps {
  product: {
    image?: string | null;
    images?: string[] | null;
    modelUrl?: string | null;
    modelPosterUrl?: string | null;
    name: string;
    brand: string;
  };
}

type Tab = "model" | "photos";

export function ProductGallery({ product }: ProductGalleryProps) {
  const media = useMemo(() => resolveProductMedia(product), [product]);
  const images = media.images;
  const mode = viewerModeFor(images);

  const [modelFailed, setModelFailed] = useState(false);
  const hasModel = Boolean(media.modelUrl) && !modelFailed;

  const [tab, setTab] = useState<Tab>(hasModel ? "model" : "photos");
  const [loadModel, setLoadModel] = useState(false);
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState(false);
  const [full, setFull] = useState(false);

  // Reset per product; only auto-download the 3D asset on capable devices.
  useEffect(() => {
    setActive(0);
    setViewer(false);
    setModelFailed(false);
    const model = Boolean(resolveProductMedia(product).modelUrl);
    setTab(model ? "model" : "photos");
    setLoadModel(model && shouldAutoLoadModel());
  }, [product]);

  // Warm the browser cache for remaining frames after the hero image.
  useEffect(() => {
    if (images.length > 1) prefetchImages(images.slice(1));
  }, [images]);

  const skeleton = (
    <div className="aspect-square w-full animate-pulse bg-gradient-to-br from-muted via-muted/60 to-muted" />
  );

  const showModel = hasModel && tab === "model";

  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
        {showModel ? (
          loadModel ? (
            <Suspense fallback={skeleton}>
              <ModelViewer
                url={media.modelUrl!}
                alt={product.name}
                onError={() => {
                  // Graceful fallback: a broken model never blocks the photos.
                  setModelFailed(true);
                  setTab("photos");
                }}
                onFullscreen={() => setFull(true)}
              />
            </Suspense>
          ) : (
            <button
              type="button"
              onClick={() => setLoadModel(true)}
              className="relative block w-full"
              aria-label="Load interactive 3D model"
            >
              <ProductImage
                src={media.poster}
                alt={product.name}
                label={product.brand}
                eager
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="aspect-square w-full object-cover"
              />
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-foreground/70 py-2 text-xs font-semibold text-background">
                <Box className="h-4 w-4" /> Tap to load 3D model
              </span>
            </button>
          )
        ) : viewer && mode !== "none" ? (
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

        {!viewer && !showModel && (
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

      <div className="mt-4 flex flex-wrap gap-2">
        {hasModel && (
          <>
            <button
              type="button"
              onClick={() => setTab("model")}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${
                tab === "model"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:border-primary hover:text-primary"
              }`}
            >
              <Box className="h-4 w-4" /> 3D model
            </button>
            <button
              type="button"
              onClick={() => setTab("photos")}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${
                tab === "photos"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:border-primary hover:text-primary"
              }`}
            >
              <Images className="h-4 w-4" /> Photos
            </button>
          </>
        )}

        {!showModel && mode !== "none" && (
          <button
            type="button"
            onClick={() => setViewer((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${
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
      </div>

      {!showModel && images.length > 1 && (
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
            className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-card animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <Suspense fallback={skeleton}>
              {hasModel && tab === "model" ? (
                <ModelViewer
                  url={media.modelUrl!}
                  alt={product.name}
                  onError={() => {
                    setModelFailed(true);
                    setTab("photos");
                  }}
                />
              ) : (
                <ProductViewer
                  images={images.length ? images : [""]}
                  alt={product.name}
                  mode={mode === "none" ? "parallax" : mode}
                  label={product.brand}
                />
              )}
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
