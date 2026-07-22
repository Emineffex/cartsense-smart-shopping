import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useFeaturedDeals, useSaveDeal, useDeleteDeal, type FeaturedDeal } from "@/services/admin";
import { SectionCard, ErrorState, EmptyState } from "./admin.index";

export const Route = createFileRoute("/admin/deals")({
  component: DealsPage,
});

type Draft = Partial<FeaturedDeal> & { id?: string };

function DealsPage() {
  const { data: deals = [], isLoading, isError, refetch } = useFeaturedDeals();
  const save = useSaveDeal();
  const del = useDeleteDeal();
  const [draft, setDraft] = useState<Draft | null>(null);

  return (
    <SectionCard
      title="Featured Deals"
      subtitle="Curated deals surfaced on the homepage"
      action={
        <button
          onClick={() => setDraft({ is_active: true })}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-brand-foreground shadow"
        >
          <Plus className="h-4 w-4" /> New deal
        </button>
      }
    >
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-background" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : deals.length === 0 ? (
        <EmptyState message="No featured deals yet. Create your first one." />
      ) : (
        <div className="space-y-3">
          {deals.map((d) => (
            <div
              key={d.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-background p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{d.title}</p>
                {d.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.description}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {d.starts_at ? `From ${new Date(d.starts_at).toLocaleDateString()} ` : ""}
                  {d.expires_at ? `→ ${new Date(d.expires_at).toLocaleDateString()}` : ""}
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={d.is_active}
                  onChange={(e) => save.mutate({ ...d, is_active: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                {d.is_active ? "Active" : "Inactive"}
              </label>
              <button
                onClick={() => setDraft(d)}
                className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm("Delete this deal?")) del.mutate(d.id);
                }}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {draft && (
        <DealEditor
          value={draft}
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

function DealEditor({
  value,
  onSave,
  onCancel,
  saving,
}: {
  value: Draft;
  onSave: (v: Draft) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [v, setV] = useState<Draft>(value);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-lg font-bold">{v.id ? "Edit deal" : "New deal"}</h3>
        <div className="mt-4 space-y-3">
          <Field label="Title">
            <input
              value={v.title ?? ""}
              onChange={(e) => setV({ ...v, title: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={v.description ?? ""}
              onChange={(e) => setV({ ...v, description: e.target.value })}
              className="input min-h-20"
            />
          </Field>
          <Field label="Image URL">
            <input
              value={v.image_url ?? ""}
              onChange={(e) => setV({ ...v, image_url: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Link URL">
            <input
              value={v.url ?? ""}
              onChange={(e) => setV({ ...v, url: e.target.value })}
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts at">
              <input
                type="date"
                value={v.starts_at ? v.starts_at.slice(0, 10) : ""}
                onChange={(e) => setV({ ...v, starts_at: e.target.value || null })}
                className="input"
              />
            </Field>
            <Field label="Expires at">
              <input
                type="date"
                value={v.expires_at ? v.expires_at.slice(0, 10) : ""}
                onChange={(e) => setV({ ...v, expires_at: e.target.value || null })}
                className="input"
              />
            </Field>
          </div>
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
            disabled={saving || !v.title?.trim()}
            onClick={() => onSave(v)}
            className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-brand-foreground shadow disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <style>{`.input{width:100%;border:1px solid hsl(var(--border));background:hsl(var(--background));border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem;outline:none}.input:focus{border-color:hsl(var(--primary))}`}</style>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
