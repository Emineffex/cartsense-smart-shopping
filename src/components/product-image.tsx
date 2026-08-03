import { useState } from "react";
import { ImageOff } from "lucide-react";
import { isUsableProductImage, placeholderHue } from "@/lib/product-image";
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
 * so there is no layout shift.
 */
export function ProductImage({ src, alt, className, label, eager, sizes }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const usable = isUsableProductImage(src) && !failed;

  if (!usable) {
    const hue = placeholderHue(label || alt || "cartsense");
    return (
      <div
        role="img"
        aria-label={`${alt} — image coming soon`}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 bg-muted text-center",
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
    <img
      src={src ?? undefined}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      sizes={sizes}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={cn(
        "bg-muted transition-[filter,opacity] duration-300",
        loaded ? "opacity-100 blur-0" : "opacity-70 blur-md",
        className,
      )}
    />
  );
}
