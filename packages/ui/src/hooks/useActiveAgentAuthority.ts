/**
 * Exposes the active agent API authority as reactive renderer state. Resource
 * caches use the same value so changing agents cannot reuse another agent's
 * data, and mounted capability views revalidate when the client is repointed.
 */

import { useSyncExternalStore } from "react";
import { client } from "../api/client";

type AuthorityAwareClient = {
  getBaseUrl?: () => string;
  onBaseUrlChange?: (onChange: () => void) => () => void;
};

const authorityAwareClient: AuthorityAwareClient = client;

function sameOriginAuthority(): string {
  if (typeof window === "undefined") return "same-origin";
  return window.location.origin;
}

export function getActiveAgentAuthority(): string {
  return authorityAwareClient.getBaseUrl?.().trim() || sameOriginAuthority();
}

function subscribeToActiveAgentAuthority(onChange: () => void): () => void {
  return authorityAwareClient.onBaseUrlChange?.(onChange) ?? (() => undefined);
}

export function useActiveAgentAuthority(): string {
  return useSyncExternalStore(
    subscribeToActiveAgentAuthority,
    getActiveAgentAuthority,
    getActiveAgentAuthority,
  );
}
