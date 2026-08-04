import { useEffect, useRef, useState } from "react";
import { Maximize2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface ModelViewerProps {
  url: string;
  alt: string;
  /** Called when the model cannot be loaded so the gallery can fall back to photos. */
  onError?: () => void;
  onFullscreen?: () => void;
}

const MIN_D = 1.2;
const MAX_D = 6;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Lazy-loaded three.js GLTF viewer: drag to rotate, wheel/pinch to zoom,
 * double-click or button to reset, fullscreen handled by the parent gallery.
 * Everything (three + loader) is dynamically imported so no 3D code ships
 * to users who never open a product with a model.
 */
export default function ModelViewer({ url, alt, onError, onFullscreen }: ModelViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const apiRef = useRef<{ zoom: (f: number) => void; reset: () => void } | null>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const host = hostRef.current;
      if (!host) return;
      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        if (disposed) return;

        const width = host.clientWidth || 400;
        const height = host.clientHeight || width;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height, false);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        scene.add(new THREE.AmbientLight(0xffffff, 1.1));
        const key = new THREE.DirectionalLight(0xffffff, 1.6);
        key.position.set(3, 4, 5);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0xffffff, 0.7);
        rim.position.set(-4, 2, -3);
        scene.add(rim);

        const pivot = new THREE.Group();
        scene.add(pivot);

        const gltf = await new Promise<{ scene: import("three").Group }>((resolve, reject) => {
          new GLTFLoader().load(
            url,
            (g) => resolve(g as unknown as { scene: import("three").Group }),
            (e) => {
              if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
            },
            (err) => reject(err),
          );
        });
        if (disposed) return;

        const model = gltf.scene;
        // Center + normalize scale so every model frames identically.
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxAxis = Math.max(size.x, size.y, size.z) || 1;
        model.position.sub(center);
        model.scale.setScalar(1.6 / maxAxis);
        pivot.add(model);

        let distance = 3.2;
        let yaw = 0.6;
        let pitch = 0.2;
        let velocity = 0;
        let dragging = false;
        const pointers = new Map<number, { x: number; y: number }>();
        let last = { x: 0, y: 0 };
        let pinch = 0;

        const applyCamera = () => {
          const p = clamp(pitch, -1.2, 1.2);
          camera.position.set(
            distance * Math.cos(p) * Math.sin(yaw),
            distance * Math.sin(p),
            distance * Math.cos(p) * Math.cos(yaw),
          );
          camera.lookAt(0, 0, 0);
        };
        applyCamera();

        let raf = 0;
        const tick = () => {
          if (!dragging) {
            velocity *= 0.94;
            if (Math.abs(velocity) > 0.0004) yaw += velocity;
            else if (!ready) velocity = 0;
          }
          applyCamera();
          renderer.render(scene, camera);
          raf = requestAnimationFrame(tick);
        };
        tick();
        setReady(true);

        const el = renderer.domElement;
        const down = (e: PointerEvent) => {
          el.setPointerCapture?.(e.pointerId);
          pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
          dragging = true;
          velocity = 0;
          last = { x: e.clientX, y: e.clientY };
          if (pointers.size === 2) {
            const [a, b] = [...pointers.values()];
            pinch = Math.hypot(a!.x - b!.x, a!.y - b!.y);
          }
        };
        const move = (e: PointerEvent) => {
          if (!pointers.has(e.pointerId)) return;
          pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.size === 2) {
            const [a, b] = [...pointers.values()];
            const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
            if (pinch > 0) distance = clamp(distance * (pinch / d), MIN_D, MAX_D);
            pinch = d;
            return;
          }
          const dx = e.clientX - last.x;
          const dy = e.clientY - last.y;
          last = { x: e.clientX, y: e.clientY };
          yaw += dx * 0.008;
          pitch = clamp(pitch + dy * 0.006, -1.2, 1.2);
          velocity = dx * 0.008;
        };
        const up = (e: PointerEvent) => {
          pointers.delete(e.pointerId);
          if (pointers.size < 2) pinch = 0;
          if (pointers.size === 0) dragging = false;
        };
        const wheel = (e: WheelEvent) => {
          e.preventDefault();
          const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
          distance = clamp(distance * Math.exp(dy * 0.0015), MIN_D, MAX_D);
        };
        const dbl = () => {
          distance = 3.2;
          yaw = 0.6;
          pitch = 0.2;
          velocity = 0;
        };

        el.addEventListener("pointerdown", down);
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", up);
        el.addEventListener("pointercancel", up);
        el.addEventListener("wheel", wheel, { passive: false });
        el.addEventListener("dblclick", dbl);

        apiRef.current = {
          zoom: (f) => {
            distance = clamp(distance * f, MIN_D, MAX_D);
          },
          reset: dbl,
        };

        const onResize = () => {
          const w = host.clientWidth || width;
          const h = host.clientHeight || w;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        const ro = new ResizeObserver(onResize);
        ro.observe(host);

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          el.removeEventListener("pointerdown", down);
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerup", up);
          el.removeEventListener("pointercancel", up);
          el.removeEventListener("wheel", wheel);
          el.removeEventListener("dblclick", dbl);
          scene.traverse((obj) => {
            const mesh = obj as import("three").Mesh;
            mesh.geometry?.dispose?.();
            const mat = mesh.material as
              | import("three").Material
              | import("three").Material[]
              | undefined;
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
            else mat?.dispose?.();
          });
          renderer.dispose();
          el.remove();
        };
      } catch {
        if (!disposed) onError?.();
      }
    })();

    return () => {
      disposed = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <div className="relative aspect-square w-full touch-none select-none overflow-hidden">
      <div ref={hostRef} className="h-full w-full cursor-grab active:cursor-grabbing" role="img" aria-label={`${alt} — interactive 3D model`} />

      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/60 backdrop-blur-sm animate-fade-in">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <div className="h-1 w-32 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-brand-gradient transition-all duration-200"
              style={{ width: `${Math.max(progress, 8)}%` }}
            />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Loading 3D model
          </span>
        </div>
      )}

      {ready && (
        <>
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground/70 px-3 py-1 text-[10px] font-medium text-background">
            Drag to rotate · scroll to zoom
          </div>
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => apiRef.current?.zoom(1 / 1.25)}
              className="rounded-lg border border-border bg-background/90 p-2 text-muted-foreground hover:border-primary hover:text-primary"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => apiRef.current?.zoom(1.25)}
              className="rounded-lg border border-border bg-background/90 p-2 text-muted-foreground hover:border-primary hover:text-primary"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Reset 3D view"
              onClick={() => apiRef.current?.reset()}
              className="rounded-lg border border-border bg-background/90 p-2 text-muted-foreground hover:border-primary hover:text-primary"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            {onFullscreen && (
              <button
                type="button"
                aria-label="Open full-screen 3D view"
                onClick={onFullscreen}
                className="rounded-lg border border-border bg-background/90 p-2 text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
