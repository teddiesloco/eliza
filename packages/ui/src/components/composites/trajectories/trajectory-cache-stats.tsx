/**
 * Trajectory-viewer panel listing prompt-cache metrics (hits, tokens saved,
 * etc.) for one agent run. Presentational: the parent formats and passes the
 * metric rows; renders an empty-state when none were captured.
 */
import type * as React from "react";

export interface TrajectoryCacheMetric {
  id?: string;
  label: React.ReactNode;
  value: React.ReactNode;
  meta?: React.ReactNode;
}

export interface TrajectoryCacheStatsProps {
  emptyLabel?: React.ReactNode;
  heading: React.ReactNode;
  metrics: readonly TrajectoryCacheMetric[];
}

export function TrajectoryCacheStats({
  emptyLabel = "No cache observations captured",
  heading,
  metrics,
}: TrajectoryCacheStatsProps) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-[color:var(--settings-hairline)] bg-[var(--settings-panel)]">
      <div className="px-4 pb-2 pt-4 text-sm font-semibold text-[color:var(--settings-foreground)]">
        {heading}
      </div>
      {metrics.length === 0 ? (
        <div className="px-4 pb-4 text-sm leading-5 text-[color:var(--settings-muted)]">
          {emptyLabel}
        </div>
      ) : (
        <dl className="grid grid-cols-2 border-t border-[color:var(--settings-hairline)] min-[620px]:grid-cols-4">
          {metrics.map((metric) => (
            <div
              className="border-b border-[color:var(--settings-hairline)] px-4 py-3 odd:border-r min-[620px]:border-b-0 min-[620px]:border-r min-[620px]:last:border-r-0"
              key={
                metric.id ?? `${String(metric.label)}-${String(metric.value)}`
              }
            >
              <dt className="text-xs text-[color:var(--settings-muted)]">
                {metric.label}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[color:var(--settings-foreground)]">
                {metric.value}
              </dd>
              {metric.meta ? (
                <div className="mt-1 text-xs text-[color:var(--settings-muted)]">
                  {metric.meta}
                </div>
              ) : null}
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
