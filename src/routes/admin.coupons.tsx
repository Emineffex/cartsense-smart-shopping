import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useCoupons, useSaveCoupon, useDeleteCoupon, useAdminStores, type Coupon } from "@/services/admin";
import { SectionCard, ErrorState, EmptyState } from "./admin.index";
import { Field } from "./admin.deals";

export const Route = createFileRoute("/admin/coupons")({
  component: CouponsPage,
});

type Draft = Partial<Coupon> & { id?: string };

function CouponsPage() {
  const { data: coupons = [], isLoading, isError, refetch } = useCoupons();
  const { data: stores = [] } = useAdminStores();
  const save = useSaveCoupon();
  const del = useDeleteCoupon();
  const [draft, setDraft] = useState<Draft | null>(null);

  const storeName = (id: string | null) => stores.find((s) => s.id === id)?.name ?? "—";

  return (
    <SectionCard
      title="Coupons"
      subtitle="Store coupon codes with expiry"
      action={
        <button
          onClick={() => setDraft({ is_active: true })}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-brand-foreground shadow"
        >
          <Plus className="h-4 w-4" /> New coupon
        </button>
      }
    >
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-background" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : coupons.length === 0 ? (
        <EmptyState message="No coupons yet." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Store</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Expires</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 font-mono font-semibold">{c.code}</td>
                  <td className="p-3">{storeName(c.store_id)}</td>
                  <td className="p-3">{c.discount ?? "—"}</td>
                  <td className="p-3">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={c.is_active}
                        onChange={(e) => save.mutate({ ...c, is_active: e.target.checked })}
                        className="h-4 w-4 accent-primary"
                      />
                      {c.is_active ? "Active" : "Inactive"}
                    </label>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setDraft(c)}
                        className="rounded-lg border border-border px-2 py-1 text-xs hover:border-primary hover:text-primary"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this coupon?")) del.mutate(c.id);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {draft && (
        <CouponEditor
          value={draft}
          stores={stores}
          onCancel={() => setDraft(null)}
          onSave={async (v) => {
            await save.mutateAsync(v);
            setDraft(null);
          }}
          saving={save.isPending}
        />
      )}
    </SectionCard>
  );
}

function CouponEditor({
  value,
  stores,
  onSave,
  onCancel,
  saving,
}: {
  value: Draft;
  stores: { id: string; name: string }[];
  onSave: (v: Draft) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [v, setV] = useState<Draft>(value);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-lg font-bold">{v.id ? "Edit coupon" : "New coupon"}</h3>
        <div className="mt-4 space-y-3">
          <Field label="Code">
            <input
              value={v.code ?? ""}
              onChange={(e) => setV({ ...v, code: e.target.value.toUpperCase() })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-primary"
            />
          </Field>
          <Field label="Title">
            <input
              value={v.title ?? ""}
              onChange={(e) => setV({ ...v, title: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field label="Store">
            <select
              value={v.store_id ?? ""}
              onChange={(e) => setV({ ...v, store_id: e.target.value || null })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">—</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Discount (e.g. 20% OFF)">
            <input
              value={v.discount ?? ""}
              onChange={(e) => setV({ ...v, discount: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field label="Expires at">
            <input
              type="date"
              value={v.expires_at ? v.expires_at.slice(0, 10) : ""}
              onChange={(e) => setV({ ...v, expires_at: e.target.value || null })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={v.is_active ?? true}
              onChange={(e) => setV({ ...v, is_active: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            Active
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">
            Cancel
          </button>
          <button
            disabled={saving || !v.code?.trim()}
            onClick={() => onSave(v)}
            className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-brand-foreground shadow disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
