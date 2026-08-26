/**
 * Fire-and-forget renderer reports for the agent's active-view lifecycle.
 *
 * Navigation must remain usable when the runtime is offline, while a healthy
 * runtime must receive the exact owning view id so it can scope prompt context
 * and actions to the surface the user can actually see.
 */

import { logger } from "@elizaos/logger";
import { client } from "../api";

/** View lifecycle reports share the bounded 15s renderer-network budget. */
const VIEW_NAVIGATION_FETCH_TIMEOUT_MS = 15_000;

type ViewNavigationAction = "close" | "close-all";

async function postViewNavigationReport(args: {
  viewId: string;
  viewPath?: string;
  action?: ViewNavigationAction;
}): Promise<void> {
  const res = await client.rawRequest(
    `/api/views/${encodeURIComponent(args.viewId)}/navigate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "user",
        ...(args.viewPath ? { path: args.viewPath } : {}),
        ...(args.action ? { action: args.action } : {}),
      }),
    },
    { allowNonOk: true, timeoutMs: VIEW_NAVIGATION_FETCH_TIMEOUT_MS },
  );
  if (!res.ok) {
    throw new Error(
      `POST /api/views/${args.viewId}/navigate returned HTTP ${res.status}`,
    );
  }
  await res.arrayBuffer();
}

function reportViewNavigation(args: {
  viewId: string;
  viewPath?: string;
  action?: ViewNavigationAction;
}): void {
  try {
    void postViewNavigationReport(args).catch((err) => {
      // error-policy:J7 reporting must never break local navigation. Keep a
      // failed runtime hop observable without presenting it as a page failure.
      logger.warn(
        `[view-navigation-report] report failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    });
  } catch {
    // error-policy:J7 synchronous environment/setup failures are equally
    // non-blocking because browser history remains the source of UI truth.
  }
}

/** Publish the exact agent-surface the user opened. */
export function reportUserViewSwitch(viewId: string, viewPath?: string): void {
  reportViewNavigation({ viewId, viewPath });
}

/**
 * Clear every view-scoped capability when the user returns to Home/launcher.
 * `__all__` is the server's synthetic lifecycle target for `close-all`.
 */
export function reportUserViewClosed(): void {
  reportViewNavigation({ viewId: "__all__", action: "close-all" });
}
