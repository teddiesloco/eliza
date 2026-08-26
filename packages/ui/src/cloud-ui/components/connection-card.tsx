/**
 * Connection card layout component for platform integration settings.
 * Provides a consistent shell for Discord, Telegram, Twitter, etc. connection UIs.
 */
"use client";

import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Copy,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import type * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  SettingsGroup,
  SettingsRow,
} from "../../components/settings/settings-layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../components/ui/collapsible";
import { Label } from "../../components/ui/label";
import { cn } from "../lib/utils";

type ConnectionCardStatus =
  | "loading"
  | "not-configured"
  | "connected"
  | "disconnected"
  // The status probe FAILED (transport / 5xx / parse / auth). Distinct from
  // "disconnected" (a healthy "not connected yet") so a broken/unreachable
  // backend never renders as the setup form (#12784/#13419 three-state).
  | "error";

interface ConnectionCardProps {
  /** Integration name (e.g. "Discord Bot") */
  name: string;
  /** Icon element for the integration */
  icon: React.ReactNode;
  /** Brand accent color class (e.g. "text-[#5865F2]") */
  brandColorClass?: string;
  /** Short description of the integration */
  description: string;
  /** Current connection status */
  status: ConnectionCardStatus;
  /** Content shown when connected */
  connectedContent?: React.ReactNode;
  /** Content shown when disconnected (setup form) */
  setupContent?: React.ReactNode;
  /** Content shown when not configured */
  notConfiguredMessage?: string;
  /**
   * Diagnostic returned by the provider when its status probe fails.
   * ConnectionCard deliberately does not repeat this message in every row;
   * ConnectionStatusNotice owns the single section-level recovery state.
   */
  errorMessage?: string;
  /** Optional retry included in the section-level recovery action. */
  onRetry?: () => void;
  /** @deprecated Recovery copy is standardized by ConnectionStatusNotice. */
  retryLabel?: string;
  /** Status badge shown in the header when connected */
  statusBadge?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

function ConnectionLoadingCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "settings-surface min-w-0 overflow-hidden rounded-[16px] border border-[color:var(--settings-hairline)] bg-[var(--settings-panel)]",
        className,
      )}
      role="status"
      aria-label="Checking connection status"
    >
      <SettingsRow
        label={
          <span className="block h-4 w-32 max-w-full animate-pulse rounded bg-[var(--settings-fill-strong)]" />
        }
        description={
          <span className="mt-1 block h-3 w-20 max-w-full animate-pulse rounded bg-[var(--settings-fill)]" />
        }
      />
    </div>
  );
}

function ConnectionConnectedBadge({
  label = "Connected",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <Badge variant="outline" tone="success" className={className}>
      <CheckCircle className="size-3 mr-1" />
      {label}
    </Badge>
  );
}

interface ConnectionIdentityPanelProps {
  icon: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  iconClassName?: string;
  className?: string;
  actions?: React.ReactNode;
}

interface UnavailableConnection {
  name: string;
  retry?: () => void;
}

type ConnectionStatusReporter = (
  id: string,
  connection: UnavailableConnection | null,
) => void;

const ConnectionStatusReportContext =
  createContext<ConnectionStatusReporter | null>(null);
const UnavailableConnectionsContext = createContext<
  readonly UnavailableConnection[]
>([]);

/**
 * Collects provider-level probe failures without coupling each connector to
 * section layout. A section can then render one quiet recovery row instead of
 * repeating a destructive alert inside every connector.
 */
function ConnectionStatusProvider({ children }: { children: React.ReactNode }) {
  const [unavailable, setUnavailable] = useState<
    Map<string, UnavailableConnection>
  >(() => new Map());

  const report = useCallback<ConnectionStatusReporter>((id, connection) => {
    setUnavailable((current) => {
      if (connection === null) {
        if (!current.has(id)) return current;
        const next = new Map(current);
        next.delete(id);
        return next;
      }

      const previous = current.get(id);
      if (
        previous?.name === connection.name &&
        previous.retry === connection.retry
      ) {
        return current;
      }
      const next = new Map(current);
      next.set(id, connection);
      return next;
    });
  }, []);

  const entries = useMemo(() => [...unavailable.values()], [unavailable]);

  return (
    <ConnectionStatusReportContext.Provider value={report}>
      <UnavailableConnectionsContext.Provider value={entries}>
        {children}
      </UnavailableConnectionsContext.Provider>
    </ConnectionStatusReportContext.Provider>
  );
}

/** One compact, section-owned degraded-state signal for all failed probes. */
function ConnectionStatusNotice() {
  const unavailable = useContext(UnavailableConnectionsContext);
  const retryable = useMemo(
    () => unavailable.filter((connection) => connection.retry),
    [unavailable],
  );
  const retryAll = useCallback(() => {
    for (const connection of retryable) connection.retry?.();
  }, [retryable]);

  if (unavailable.length === 0) return null;

  return (
    <SettingsGroup
      data-slot="connection-status-notice"
      aria-live="polite"
      aria-atomic="true"
    >
      <SettingsRow
        icon={AlertTriangle}
        label="Status checks unavailable"
        description="Setup is hidden until checks recover."
        control={
          retryable.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Retry unavailable connections"
              onClick={retryAll}
            >
              <RefreshCw className="size-4" aria-hidden />
              Retry
            </Button>
          ) : null
        }
      />
    </SettingsGroup>
  );
}

function ConnectionIdentityPanel({
  icon,
  title,
  subtitle,
  children,
  iconClassName,
  className,
  actions,
}: ConnectionIdentityPanelProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-[12px] bg-[var(--settings-secondary)] p-4",
        className,
      )}
    >
      <div
        className={cn(
          "size-12 rounded-full flex items-center justify-center shrink-0",
          iconClassName,
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold truncate">{title}</div>}
        {subtitle && (
          <div className="text-sm text-muted-foreground">{subtitle}</div>
        )}
        {children}
      </div>
      {actions}
    </div>
  );
}

interface ConnectionCalloutProps {
  title?: React.ReactNode;
  items?: React.ReactNode[];
  children?: React.ReactNode;
  tone?: "blue" | "green" | "red" | "yellow" | "muted";
  className?: string;
}

const calloutToneClassName: Record<
  NonNullable<ConnectionCalloutProps["tone"]>,
  string
> = {
  // Brand rule: blue is banned. Existing `tone="blue"` call sites now
  // render as a neutral informational callout instead.
  blue: "border-[color:var(--settings-hairline)] bg-[var(--settings-fill)] text-[color:var(--settings-foreground)]",
  green: "bg-status-success-bg border-status-success/30 text-status-success",
  red: "bg-destructive-subtle border-destructive/30 text-destructive",
  yellow: "bg-status-warning-bg border-status-warning/30 text-status-warning",
  muted:
    "border-[color:var(--settings-hairline)] bg-[var(--settings-fill)] text-[color:var(--settings-foreground)]",
};

function ConnectionCallout({
  title,
  items,
  children,
  tone = "muted",
  className,
}: ConnectionCalloutProps) {
  return (
    <div
      className={cn(
        "rounded-[12px] border p-3",
        calloutToneClassName[tone],
        className,
      )}
    >
      {title && <p className="text-sm font-medium mb-2">{title}</p>}
      {items && items.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1">
          {items.map((item) => (
            <li key={String(item)}>• {item}</li>
          ))}
        </ul>
      )}
      {children}
    </div>
  );
}

interface ConnectionInstructionsProps {
  title: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  triggerClassName?: string;
  contentClassName?: string;
}

function ConnectionInstructions({
  title,
  open,
  onOpenChange,
  children,
  triggerClassName,
  contentClassName,
}: ConnectionInstructionsProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button variant="sectionToggle" className={triggerClassName}>
          <span className="font-medium">{title}</span>
          <ChevronDown
            className={cn("size-4 transition-transform", open && "rotate-180")}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          "rounded-b-[12px] border-t border-[color:var(--settings-hairline)] bg-[var(--settings-secondary)] p-4",
          contentClassName,
        )}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface ConnectionCopyRowProps {
  label: React.ReactNode;
  value: string;
  onCopied?: (value: string) => void;
  copyLabel?: string;
  className?: string;
}

function ConnectionCopyRow({
  label,
  value,
  onCopied,
  copyLabel = "Copy",
  className,
}: ConnectionCopyRowProps) {
  return (
    <div
      className={cn(
        "space-y-2 rounded-[12px] bg-[var(--settings-secondary)] p-3",
        className,
      )}
    >
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-background p-2 rounded-sm border overflow-x-auto">
          {value}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void navigator.clipboard.writeText(value);
            onCopied?.(value);
          }}
        >
          <Copy className="size-4 mr-1" />
          {copyLabel}
        </Button>
      </div>
    </div>
  );
}

interface ConnectionDisconnectActionProps {
  title: React.ReactNode;
  description: React.ReactNode;
  onDisconnect: () => void;
  isDisconnecting?: boolean;
  buttonLabel?: string;
  confirmLabel?: string;
  triggerIcon?: React.ReactNode;
}

function ConnectionDisconnectAction({
  title,
  description,
  onDisconnect,
  isDisconnecting = false,
  buttonLabel = "Disconnect",
  confirmLabel = "Disconnect",
  triggerIcon,
}: ConnectionDisconnectActionProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="dangerOutline" size="sm" disabled={isDisconnecting}>
          {isDisconnecting ? (
            <Loader2 className="size-4 animate-spin mr-1" />
          ) : (
            (triggerIcon ?? <XCircle className="size-4 mr-1" />)
          )}
          {buttonLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDisconnect}
            className="bg-destructive text-destructive-fg hover:bg-destructive/85"
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConnectionFooterActions({
  note,
  children,
  className,
}: {
  note?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-t border-[color:var(--settings-hairline)] pt-2",
        className,
      )}
    >
      {note && <div className="text-sm text-muted-foreground">{note}</div>}
      {children}
    </div>
  );
}

function ConnectionCard({
  name,
  icon,
  description,
  status,
  connectedContent,
  setupContent,
  notConfiguredMessage = "This integration is not configured. Please contact your administrator.",
  onRetry,
  statusBadge,
  className,
}: ConnectionCardProps) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const reportStatus = useContext(ConnectionStatusReportContext);
  const retryRef = useRef(onRetry);
  retryRef.current = onRetry;
  const retryConnection = useCallback(() => retryRef.current?.(), []);
  const canRetry = Boolean(onRetry);

  useEffect(() => {
    if (status === "loading" || status === "error") setOpen(false);
  }, [status]);

  useEffect(() => {
    if (!reportStatus) return;
    reportStatus(
      contentId,
      status === "error"
        ? {
            name,
            retry: canRetry ? retryConnection : undefined,
          }
        : null,
    );
    return () => reportStatus(contentId, null);
  }, [canRetry, contentId, name, reportStatus, retryConnection, status]);

  const statusLabel =
    status === "loading"
      ? "Checking connection"
      : status === "connected"
        ? "Connected"
        : status === "disconnected"
          ? "Not connected"
          : "Unavailable";
  const actionLabel = open
    ? "Close"
    : status === "connected"
      ? "Manage"
      : status === "disconnected"
        ? "Set up"
        : "Details";

  return (
    <SettingsRow
      className={cn("settings-surface", className)}
      label={
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--settings-secondary)] [&>svg]:size-[18px]">
            {icon}
          </span>
          <span className="min-w-0 truncate">{name}</span>
        </span>
      }
      description={
        status === "loading" ? (
          <span className="flex items-center gap-2" aria-live="polite">
            <span className="block h-3 w-20 animate-pulse rounded bg-[var(--settings-fill-strong)]" />
            <span className="sr-only">{statusLabel}</span>
          </span>
        ) : (
          <span aria-live="polite">{statusLabel}</span>
        )
      }
      control={
        status === "loading" ? (
          <span className="block h-8 w-20 animate-pulse rounded-lg bg-[var(--settings-fill)]" />
        ) : status === "error" ? null : (
          <span className="flex items-center gap-2">
            {status === "connected" && statusBadge ? (
              <span className="hidden sm:inline-flex">{statusBadge}</span>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-expanded={open}
              aria-controls={contentId}
              aria-label={`${actionLabel} ${name}`}
              onClick={() => setOpen((current) => !current)}
            >
              {actionLabel}
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  open && "rotate-180",
                )}
                aria-hidden
              />
            </Button>
          </span>
        )
      }
    >
      {open && status !== "loading" && status !== "error" ? (
        <div
          id={contentId}
          data-slot="connection-card-content"
          className="min-w-0 border-t border-[color:var(--settings-hairline)] pb-1 pt-4"
        >
          <p className="mb-4 break-words text-sm leading-5 text-[color:var(--settings-muted)]">
            {description}
          </p>
          {status === "not-configured" ? (
            <div className="rounded-[12px] bg-[var(--settings-secondary)] p-4">
              <p className="text-sm text-[color:var(--settings-muted)]">
                {notConfiguredMessage}
              </p>
            </div>
          ) : null}
          {status === "connected" ? connectedContent : null}
          {status === "disconnected" ? setupContent : null}
        </div>
      ) : null}
    </SettingsRow>
  );
}

export type { ConnectionCardProps, ConnectionCardStatus };
export {
  ConnectionCallout,
  ConnectionCard,
  ConnectionConnectedBadge,
  ConnectionCopyRow,
  ConnectionDisconnectAction,
  ConnectionFooterActions,
  ConnectionIdentityPanel,
  ConnectionInstructions,
  ConnectionLoadingCard,
  ConnectionStatusNotice,
  ConnectionStatusProvider,
};
