/** One full-width grouped row in the trajectory history list. */
import { ChevronRight } from "lucide-react";
import type * as React from "react";

import { SettingsRow } from "../../settings/settings-layout";

export interface TrajectorySidebarItemProps {
  active?: boolean;
  callCount: React.ReactNode;
  durationLabel: React.ReactNode;
  onSelect?: () => void;
  sourceColor?: string;
  sourceLabel: React.ReactNode;
  statusColor?: string;
  statusLabel: React.ReactNode;
  title: React.ReactNode;
  tokenLabel: React.ReactNode;
}

export function TrajectorySidebarItem({
  active = false,
  callCount,
  durationLabel,
  onSelect,
  sourceColor: _sourceColor,
  sourceLabel,
  statusColor,
  statusLabel,
  title,
  tokenLabel,
}: TrajectorySidebarItemProps) {
  return (
    <SettingsRow
      active={active}
      onClick={onSelect}
      label={title}
      description={
        <span className="flex min-w-0 flex-wrap gap-x-2 gap-y-0.5">
          <span className="max-w-full truncate">{sourceLabel}</span>
          <span>{tokenLabel}</span>
          <span>{durationLabel}</span>
        </span>
      }
      trailing={
        <span className="flex items-center gap-2 text-xs text-[color:var(--settings-muted)]">
          <span className="hidden min-[360px]:inline">{callCount} calls</span>
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-[var(--settings-muted)]"
              style={statusColor ? { backgroundColor: statusColor } : undefined}
            />
            <span className="sr-only">{statusLabel}</span>
          </span>
          <ChevronRight className="size-4" aria-hidden />
        </span>
      }
      className="min-h-[68px]"
    />
  );
}
