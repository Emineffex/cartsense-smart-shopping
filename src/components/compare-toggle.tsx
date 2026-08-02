import { Check, Plus } from "lucide-react";
import { useCompare } from "@/hooks/use-compare";
import { cn } from "@/lib/utils";

/**
 * Small add/remove-from-comparison control.
 * Reused by ProductCard (search results) and Product Details.
 */
export function CompareToggle({
  productId,
  variant = "icon",
  className,
}: {
  productId: string;
  variant?: "icon" | "button";
  className?: string;
}) {
  const { has, toggle, isFull } = useCompare();
  const active = has(productId);
  const disabled = !active && isFull;

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    toggle(productId);
  };

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={disabled ? "Comparison list is full (6 products)" : undefined}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold disabled:opacity-50",
          active
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-background hover:border-primary hover:text-primary",
          className,
        )}
      >
        {active ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {active ? "In comparison" : "Add to compare"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={active ? "Remove from comparison" : "Add to comparison"}
      title={disabled ? "Comparison list is full (6 products)" : active ? "Remove from comparison" : "Add to comparison"}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur transition-colors disabled:opacity-50",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background/90 text-foreground hover:border-primary hover:text-primary",
        className,
      )}
    >
      {active ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
      Compare
    </button>
  );
}
