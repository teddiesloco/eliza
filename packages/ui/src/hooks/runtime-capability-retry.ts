/**
 * Retries a briefly missing runtime route during deferred capability startup.
 * Typed unavailable errors remain terminal; only an untyped 404 route miss is
 * treated as warm-up, and the original error is preserved after the bound.
 */

import { isApiError } from "../api/client-types-core";

export const CAPABILITY_WARMUP_DELAYS_MS = [250, 500, 1_000, 2_000] as const;

const TERMINAL_UNAVAILABLE_CODES = new Set([
  "documents_runtime_unavailable",
  "memory_runtime_unavailable",
  "relationships_runtime_unavailable",
]);

export function isCapabilityWarmupMiss(error: unknown): boolean {
  return (
    isApiError(error) &&
    error.status === 404 &&
    !TERMINAL_UNAVAILABLE_CODES.has(error.code ?? "")
  );
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function loadAfterCapabilityWarmup<T>(
  load: () => Promise<T>,
  options?: {
    delaysMs?: readonly number[];
    retryWhen?: (error: unknown) => boolean;
  },
): Promise<T> {
  const delaysMs = options?.delaysMs ?? CAPABILITY_WARMUP_DELAYS_MS;
  const retryWhen = options?.retryWhen ?? isCapabilityWarmupMiss;

  for (const delayMs of delaysMs) {
    try {
      return await load();
    } catch (error) {
      if (!retryWhen(error)) throw error;
      await wait(delayMs);
    }
  }

  return load();
}
