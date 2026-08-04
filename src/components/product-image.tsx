import { useState } from "react";
import { ImageOff } from "lucide-react";
import { isUsableProductImage, placeholderHue } from "@/lib/product-image";
import { getMediaStatus, setMediaStatus } from "@/lib/product-media";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  /** Applied to the rendered image / placeholder box (keep existing sizing classes here). */
  className?: string;
  /** Text shown under the icon on the placeholder (usually brand). */
  label?: string;
  eager?: boolean;
  sizes?: string;
}

/**
 * Renders a real product photo, or a clean branded "Image coming soon" tile.
 * Never falls back to unrelated stock imagery. Reserves the same box either way
 * so there is no layout shift. Previously loaded/failed URLs are remembered in
 * the media cache so repeat visits skip the blur-up (or the broken request).
 */
export function ProductImage({ src, alt, className, label, eager, sizes }: ProductImageProps) {
  const cached = getMediaStatus(src);
  const [failed, setFailed] = useState(cached === "failed");
  const [loaded, setLoaded] = useState(cached === "ok");
  const usable = isUsableProductImage(src) && !failed;

  if (!usable) {
    const hue = placeholderHue(label || alt || "cartsense");
    return (
      <div
        role="img"
        aria-label={`${alt} — image coming soon`}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 bg-muted text-center animate-fade-in",
          className,
        )}
        style={{
          backgroundImage: `linear-gradient(135deg, hsl(${hue} 70% 96%), hsl(${(hue + 24) % 360} 80% 92%))`,
        }}
      >
        <ImageOff className="h-1/5 max-h-8 min-h-4 w-auto text-primary/60" />
        {label ? (
          <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        ) : null}
        <span className="px-2 text-[9px] font-medium uppercase tracking-wide text-muted-foreground/80">
          Image coming soon
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/60 to-muted" />
      )}
      <img
        src={src ?? undefined}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : "auto"}
        sizes={sizes}
        onLoad={() => {
          setMediaStatus(src, "ok");
          setLoaded(true);
        }}
        onError={() => {
          setMediaStatus(src, "failed");
          setFailed(true);
        }}
        className={cn(
          "h-full w-full bg-muted object-cover transition-[filter,opacity,transform] duration-500",
          loaded ? "scale-100 opacity-100 blur-0" : "scale-[1.02] opacity-0 blur-md",
        )}
      />
    </div>
  );
}
