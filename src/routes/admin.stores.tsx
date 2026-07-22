import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAdminStores, useSaveStore, type AdminStore } from "@/services/admin";
import { SectionCard, ErrorState, EmptyState } from "./admin.index";

export const Route = createFileRoute("/admin/stores")({
  component: StoresPage,
});

function StoresPage() {
  const { data: stores = [], isLoading, isError, refetch } = useAdminStores();

  return (
    <SectionCard title="Stores" subtitle="Manage affiliate URLs and enable/disable stores">
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-background" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : stores.length === 0 ? (
        <EmptyState message="No stores configured." />
      ) : (
        <div className="space-y-3">
          {stores.map((s) => (
            <StoreRow key={s.id} store={s} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function StoreRow({ store }: { store: AdminStore }) {
  const save = useSaveStore();
  const [url, setUrl] = useState(store.affiliate_url ?? "");
  const [active, setActive] = useState(store.is_active);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setUrl(store.affiliate_url ?? "");
    setActive(store.is_active);
    setDirty(false);
  }, [store.id, store.affiliate_url, store.is_active]);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-background p-4">
      <div className="min-w-40 flex-1">
        <p className="text-sm font-semibold">{store.name}</p>
        {store.tagline && <p className="text-xs text-muted-foreground">{store.tagline}</p>}
      </div>
      <input
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setDirty(true);
        }}
        placeholder="Affiliate URL"
        className="min-w-60 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <label className="flex items-center gap-2 text-xs font-semibold">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => {
            setActive(e.target.checked);
            setDirty(true);
          }}
          className="h-4 w-4 accent-primary"
        />
        {active ? "Enabled" : "Disabled"}
      </label>
      <button
        disabled={!dirty || save.isPending}
        onClick={async () => {
          await save.mutateAsync({ id: store.id, affiliate_url: url || null, is_active: active });
          setDirty(false);
        }}
        className="rounded-lg bg-brand-gradient px-3 py-2 text-xs font-semibold text-brand-foreground shadow disabled:opacity-60"
      >
        {save.isPending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
