/**
 * TrajectoryPipelineGraph — horizontal pipeline visualization showing
 * agent processing stages: input → shouldRespond → plan → actions → evaluators.
 *
 * Pure presentational component. The parent owns filter state and passes
 * pre-computed node data.
 */

import type { LucideIcon } from "lucide-react";
import { Button } from "../../ui/button";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type PipelineStageId =
  | "input"
  | "should_respond"
  | "plan"
  | "actions"
  | "evaluators";

export interface PipelineNode {
  id: PipelineStageId;
  label: string;
  callCount: number;
  status: "active" | "skipped" | "error";
  icon: LucideIcon;
}

export interface TrajectoryPipelineGraphProps {
  /** Ordered array of pipeline nodes (typically 5). */
  nodes: PipelineNode[];
  /** Currently selected stage, or null for "show all". */
  activeStageId: PipelineStageId | null;
  /** Callback when a stage node is clicked. */
  onStageClick: (stageId: PipelineStageId) => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PipelineConnector({ dimmed }: { dimmed?: boolean }) {
  return (
    <span
      aria-hidden
      className={`h-px w-4 shrink-0 bg-[var(--settings-hairline)] ${
        dimmed ? "opacity-40" : ""
      }`}
    />
  );
}

function PipelineNodeButton({
  node,
  selected,
  onClick,
}: {
  node: PipelineNode;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = node.icon;

  const iconColor = {
    active: selected
      ? "text-[color:var(--settings-foreground)]"
      : "text-[color:var(--settings-muted)]",
    skipped: "text-[color:var(--settings-muted)] opacity-50",
    error: "text-danger/80",
  };

  return (
    <Button
      variant="selection"
      size="tile"
      data-state={selected ? "on" : "off"}
      onClick={onClick}
      className="min-w-[7rem]"
    >
      <Icon className={`size-5 ${iconColor[node.status]}`} />
      <span className="whitespace-nowrap text-xs font-medium">
        {node.label}
      </span>
      <span className="text-xs text-[color:var(--settings-muted)]">
        {node.id === "input" ? "Ready" : `${node.callCount} calls`}
      </span>
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TrajectoryPipelineGraph({
  nodes,
  activeStageId,
  onStageClick,
}: TrajectoryPipelineGraphProps) {
  return (
    <div className="flex items-center overflow-x-auto py-1">
      {nodes.map((node, i) => (
        <div key={node.id} className="contents">
          {i > 0 && (
            <PipelineConnector
              dimmed={
                node.status === "skipped" ||
                (i > 0 && nodes[i - 1].status === "skipped")
              }
            />
          )}
          <PipelineNodeButton
            node={node}
            selected={activeStageId === node.id}
            onClick={() => onStageClick(node.id)}
          />
        </div>
      ))}
    </div>
  );
}
