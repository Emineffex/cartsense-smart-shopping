import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import type { ViewerMode } from "@/lib/product-image";

interface ProductViewerProps {
  images: string[];
  alt: string;
  mode: ViewerMode;
  label?: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Premium product viewer.
 * - "spin": pseudo-360 by cycling through the product's real frames on drag (with inertia).
 * - "parallax": subtle 3D tilt for single-image products (never pretends to be 360).
 * Both modes support wheel/pinch zoom, pan while zoomed, and double-click reset.
 */
export default function ProductViewer({ images, alt, mode, label }: ProductViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const frameF = useRef(0);
  const velocity = useRef(0);
  const raf = useRef<number | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const last = useRef({ x: 0, y: 0, t: 0 });
  const pinchDist = useRef(0);

  const count = images.length;

  const setFrameF = useCallback(
    (v: number) => {
      if (count === 0) return;
      const wrapped = ((v % count) + count) % count;
      frameF.current = wrapped;
      setFrame(Math.floor(wrapped));
    },
    [count],
  );

  const stopInertia = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  };

  const runInertia = useCallback(() => {
    stopInertia();
    const step = () => {
      velocity.current *= 0.94;
      if (Math.abs(velocity.current) < 0.002) {
        raf.current = null;
        return;
      }
      setFrameF(frameF.current + velocity.current);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, [setFrameF]);

  useEffect(() => stopInertia, []);

  const reset = () => {
    stopInertia();
    velocity.current = 0;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setTilt({ x: 0, y: 0 });
    setFrameF(0);
  };

  // Non-passive wheel zoom anchored on the cursor.
  const zoomRef = useRef(zoom);
  const offsetRef = useRef(offset);
  zoomRef.current = zoom;
  offsetRef.current = offset;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const next = clamp(zoomRef.current * Math.exp(-dy * 0.0018), MIN_ZOOM, MAX_ZOOM);
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left - rect.width / 2;
      const py = e.clientY - rect.top - rect.height / 2;
      const k = next / zoomRef.current;
      const o = offsetRef.current;
      const nx = px - (px - o.x) * k;
      const ny = py - (py - o.y) * k;
      setZoom(next);
      setOffset(next === 1 ? { x: 0, y: 0 } : { x: nx, y: ny });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    stopInertia();
    velocity.current = 0;
    last.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    setDragging(true);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) {
      if (mode === "parallax" && zoom === 1) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const rx = (e.clientY - rect.top) / rect.height - 0.5;
          const ry = (e.clientX - rect.left) / rect.width - 0.5;
          setTilt({ x: -rx * 10, y: ry * 14 });
        }
      }
      return;
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Two-finger pinch zoom
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist.current > 0) {
        const next = clamp(zoom * (dist / pinchDist.current), MIN_ZOOM, MAX_ZOOM);
        setZoom(next);
        if (next === 1) setOffset({ x: 0, y: 0 });
      }
      pinchDist.current = dist;
      return;
    }

    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    const dt = Math.max(performance.now() - last.current.t, 1);
    last.current = { x: e.clientX, y: e.clientY, t: performance.now() };

    if (zoom > 1) {
      setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
      return;
    }
    if (mode === "spin" && count > 1) {
      const perFrame = (containerRef.current?.clientWidth ?? 400) / (count * 1.6);
      const delta = dx / perFrame;
      velocity.current = (dx / perFrame) * (16 / dt);
      setFrameF(frameF.current + delta);
    } else {
      setTilt({ x: clamp(-dy / 12, -12, 12), y: clamp(dx / 10, -16, 16) });
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = 0;
    if (pointers.current.size > 0) return;
    setDragging(false);
    if (mode === "spin" && zoom === 1 && Math.abs(velocity.current) > 0.02) runInertia();
    if (mode !== "spin" || zoom > 1) setTilt({ x: 0, y: 0 });
    else setTilt({ x: 0, y: 0 });
  };

  const current = images[frame] ?? images[0];

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        onDoubleClick={reset}
        role="group"
        aria-label={
          mode === "spin" ? `${alt} — drag to rotate` : `${alt} — drag to tilt, scroll to zoom`
        }
        className="relative aspect-square w-full touch-none select-none overflow-hidden [perspective:1200px]"
        style={{ cursor: zoom > 1 ? "grab" : dragging ? "grabbing" : "ew-resize" }}
      >
        <div
          className={dragging ? "" : "transition-transform duration-300 ease-out"}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformOrigin: "center center",
          }}
        >
          <ProductImage
            src={current}
            alt={alt}
            label={label}
            eager
            className="aspect-square w-full object-cover"
          />
        </div>

        {/* Preload neighbouring frames so spinning stays smooth */}
        <div className="pointer-events-none absolute h-0 w-0 overflow-hidden" aria-hidden>
          {images.map((src) => (
            <img key={src} src={src} alt="" loading="lazy" decoding="async" />
          ))}
        </div>

        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground/70 px-3 py-1 text-[10px] font-medium text-background">
          {mode === "spin" ? "Drag to rotate 360°" : "Drag to tilt · scroll to zoom"}
        </div>
      </div>

      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => setZoom((z) => clamp(z * 1.3, MIN_ZOOM, MAX_ZOOM))}
          className="rounded-lg border border-border bg-background/90 p-2 text-muted-foreground hover:border-primary hover:text-primary"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() =>
            setZoom((z) => {
              const n = clamp(z / 1.3, MIN_ZOOM, MAX_ZOOM);
              if (n === 1) setOffset({ x: 0, y: 0 });
              return n;
            })
          }
          className="rounded-lg border border-border bg-background/90 p-2 text-muted-foreground hover:border-primary hover:text-primary"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Reset view"
          onClick={reset}
          className="rounded-lg border border-border bg-background/90 p-2 text-muted-foreground hover:border-primary hover:text-primary"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
