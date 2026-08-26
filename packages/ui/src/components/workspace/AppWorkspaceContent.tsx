/**
 * Router-owned content frame for a routed app workspace.
 *
 * This is intentionally narrower than a general page shell: views still own
 * their domain layout, while the router makes one explicit decision about
 * whether the page scrolls here or inside the view and reserves floating-chat
 * clearance at that same boundary.
 */
import type React from "react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { AppWorkspaceChrome } from "./AppWorkspaceChrome";

const CHAT_CLEARANCE_CLASS =
  "pb-[var(--eliza-chat-clearance,5.25rem)] pe-[var(--eliza-chat-side-clearance,0px)]";

export type AppWorkspaceContentLayout = "contained" | "scroll";

export interface AppWorkspaceContentProps {
  children: ReactNode;
  /** Optional fixed header rendered above the content or page scroller. */
  header?: ReactNode;
  /** Whether the router or the view owns the active scroll regions. */
  layout?: AppWorkspaceContentLayout;
  /** Optional navigation region rendered above the workspace content. */
  nav?: ReactNode;
  /**
   * Reserve room for the global floating composer. Fullscreen/immersive views
   * opt out because they intentionally fill behind the overlay.
   */
  reserveChatClearance?: boolean;
  /** Background surface delegated to AppWorkspaceChrome. */
  surface?: "opaque" | "transparent";
  /** Additional classes applied to the content or scroll region. */
  className?: string;
}

/**
 * Compose router chrome with exactly one content lifecycle boundary.
 *
 * - `contained`: the view owns any internal scroll regions; clearance lives on
 *   the containing region once.
 * - `scroll`: this component owns the page scroller; a fixed header stays
 *   outside it and clearance moves onto that scroller once.
 */
export function AppWorkspaceContent({
  children,
  header,
  layout = "contained",
  nav,
  reserveChatClearance = true,
  surface = "transparent",
  className,
}: AppWorkspaceContentProps): React.JSX.Element {
  const clearanceClass = reserveChatClearance
    ? CHAT_CLEARANCE_CLASS
    : undefined;

  const main =
    layout === "scroll" ? (
      header ? (
        <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden">
          {header}
          <div
            data-shell-scroll-region="true"
            className={cn(
              "eliza-chat-scroll min-h-0 min-w-0 w-full flex-1 overflow-y-auto",
              clearanceClass,
              className,
            )}
          >
            {children}
          </div>
        </div>
      ) : (
        <div
          data-shell-scroll-region="true"
          className={cn(
            "eliza-chat-scroll min-h-0 min-w-0 w-full flex-1 overflow-y-auto",
            clearanceClass,
            className,
          )}
        >
          {children}
        </div>
      )
    ) : (
      <div
        data-shell-content-region="true"
        className={cn(
          "eliza-chat-scroll flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden",
          clearanceClass,
          className,
        )}
      >
        {header ? (
          <>
            {header}
            <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
              {children}
            </div>
          </>
        ) : (
          children
        )}
      </div>
    );

  return (
    <AppWorkspaceChrome
      testId={layout === "scroll" ? "tab-scroll-view" : "tab-content-view"}
      surface={surface}
      nav={nav}
      main={main}
    />
  );
}
