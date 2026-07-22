import { createFileRoute } from "@tanstack/react-router";
import { useMostSearched, useTopStoresByClicks } from "@/services/admin";
import { SectionCard, ErrorState, EmptyState } from "./admin.index";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <MostSearched />
      <TopStores />
    </div>
  );
}

function MostSearched() {
  const { data = [], isLoading, isError, refetch } = useMostSearched(10);
  const max = data[0]?.count ?? 1;
  return (
    <SectionCard title="Most searched" subtitle="Top search queries">
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-background" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState message="No search activity yet." />
      ) : (
        <div className="space-y-2">
          {data.map((row) => (
            <div key={row.query} className="flex items-center gap-3">
              <div className="w-40 truncate text-sm font-medium">{row.query}</div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand-gradient"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
              <div className="w-10 text-right text-xs font-semibold text-muted-foreground">{row.count}</div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function TopStores() {
  const { data = [], isLoading, isError, refetch } = useTopStoresByClicks(10);
  const max = data[0]?.count ?? 1;
  return (
    <SectionCard title="Top stores by clicks" subtitle="Outbound clicks to store partners">
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-background" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState message="No store clicks recorded yet." />
      ) : (
        <div className="space-y-2">
          {data.map((row) => (
            <div key={row.storeId} className="flex items-center gap-3">
              <div className="w-40 truncate text-sm font-medium">{row.name}</div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand-gradient"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
              <div className="w-10 text-right text-xs font-semibold text-muted-foreground">{row.count}</div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
