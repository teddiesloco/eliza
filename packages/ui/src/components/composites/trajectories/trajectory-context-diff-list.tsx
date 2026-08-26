/**
 * Trajectory-viewer panel summarizing per-step context diffs (items added,
 * removed, changed, and token delta) across an agent run. Presentational; shows
 * an empty-state when the trajectory carries no diff data.
 */
import {
  Activity,
  type LucideIcon,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import type * as React from "react";

export interface TrajectoryContextDiffSummary {
  id: string;
  label: React.ReactNode;
  timestampLabel?: React.ReactNode;
  added?: React.ReactNode;
  removed?: React.ReactNode;
  changed?: React.ReactNode;
  tokenDelta?: React.ReactNode;
  description?: React.ReactNode;
}

export interface TrajectoryContextDiffListProps {
  diffs: readonly TrajectoryContextDiffSummary[];
  emptyLabel?: React.ReactNode;
  heading: React.ReactNode;
}

export function TrajectoryContextDiffList({
  diffs,
  emptyLabel = "Context diffs are not available for this trajectory",
  heading,
}: TrajectoryContextDiffListProps) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-[color:var(--settings-hairline)] bg-[var(--settings-panel)]">
      <div className="px-4 pb-2 pt-4 text-sm font-semibold text-[color:var(--settings-foreground)]">
        {heading}
      </div>
      {diffs.length === 0 ? (
        <div className="px-4 pb-4 text-sm leading-5 text-[color:var(--settings-muted)]">
          {emptyLabel}
        </div>
      ) : (
        <div className="divide-y divide-[color:var(--settings-hairline)]">
          {diffs.map((diff) => (
            <article key={diff.id} className="px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[color:var(--settings-foreground)]">
                    {diff.label}
                  </div>
                  {diff.description ? (
                    <div className="mt-1 text-xs text-[color:var(--settings-muted)]">
                      {diff.description}
                    </div>
                  ) : null}
                </div>
                {diff.timestampLabel ? (
                  <div className="shrink-0 text-xs text-[color:var(--settings-muted)]">
                    {diff.timestampLabel}
                  </div>
                ) : null}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 min-[620px]:grid-cols-4">
                <DiffMetric icon={Plus} label="Added" value={diff.added} />
                <DiffMetric
                  icon={Trash2}
                  label="Removed"
                  value={diff.removed}
                />
                <DiffMetric
                  icon={RefreshCcw}
                  label="Changed"
                  value={diff.changed}
                />
                <DiffMetric
                  icon={Activity}
                  label="Token Delta"
                  value={diff.tokenDelta}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function DiffMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-xs text-[color:var(--settings-muted)]">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-[color:var(--settings-foreground)]">
        {value ?? "Not recorded"}
      </div>
    </div>
  );
}
