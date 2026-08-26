/**
 * Declares HTTP prefixes mounted by app route plugins after runtime readiness.
 * The API middleware uses this manifest to distinguish a capability that is
 * still registering from a route that genuinely does not exist.
 */
import type { DeferredBootPhaseStatus } from "@elizaos/agent/runtime/deferred-boot-status";

export const DEFERRED_FEATURE_ROUTE_PREFIXES = [
  "/api/asr/cloud",
  "/api/browser-workspace",
  "/api/cloud",
  "/api/coding-agents",
  "/api/computer-use",
  "/api/documents",
  "/api/github",
  "/api/issues",
  "/api/lifeops",
  "/api/notes",
  "/api/orchestrator",
  "/api/tts/cloud",
  "/api/v1/advertising",
  "/api/wallet",
  "/api/views/notes",
] as const;

const FEATURE_ROUTE_BOOT_PHASES = [
  "agent-deferred-boot",
  "app-route-tail",
] as const;

export type FeatureRouteBootPhase = (typeof FEATURE_ROUTE_BOOT_PHASES)[number];

export type FeatureRouteReadinessFailure = {
  error: "feature_starting" | "feature_unavailable";
  code: "feature_starting" | "feature_unavailable";
  phase: FeatureRouteBootPhase;
  status: "runtime_starting" | DeferredBootPhaseStatus;
  retryable: boolean;
};

function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Returns a structured failure only for a known deferred feature route. */
export function resolveFeatureRouteReadinessFailure(
  pathname: string,
  runtimeAvailable: boolean,
  phases: Readonly<
    Partial<Record<FeatureRouteBootPhase, DeferredBootPhaseStatus>>
  >,
): FeatureRouteReadinessFailure | null {
  if (
    !DEFERRED_FEATURE_ROUTE_PREFIXES.some((prefix) =>
      matchesPathPrefix(pathname, prefix),
    )
  ) {
    return null;
  }
  if (!runtimeAvailable) {
    return {
      error: "feature_starting",
      code: "feature_starting",
      phase: "app-route-tail",
      status: "runtime_starting",
      retryable: true,
    };
  }

  const pendingPhase = FEATURE_ROUTE_BOOT_PHASES.find(
    (phase) => phases[phase] === "pending",
  );
  if (pendingPhase) {
    return {
      error: "feature_starting",
      code: "feature_starting",
      phase: pendingPhase,
      status: "pending",
      retryable: true,
    };
  }

  const failedPhase = FEATURE_ROUTE_BOOT_PHASES.find(
    (phase) => phases[phase] === "failed",
  );
  if (failedPhase) {
    return {
      error: "feature_unavailable",
      code: "feature_unavailable",
      phase: failedPhase,
      status: "failed",
      retryable: false,
    };
  }
  return null;
}
