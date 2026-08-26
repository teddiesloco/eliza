/** Verifies that mounted capability views follow the client's active agent. */
// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authorityState = vi.hoisted(() => ({
  value: "https://agent-a.test",
  listeners: new Set<() => void>(),
}));

const clientMock = vi.hoisted(() => ({
  getBaseUrl: vi.fn(() => authorityState.value),
  onBaseUrlChange: vi.fn((onChange: () => void) => {
    authorityState.listeners.add(onChange);
    return () => authorityState.listeners.delete(onChange);
  }),
}));

vi.mock("../api/client", () => ({ client: clientMock }));

import { useActiveAgentAuthority } from "./useActiveAgentAuthority";

beforeEach(() => {
  authorityState.value = "https://agent-a.test";
  authorityState.listeners.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useActiveAgentAuthority", () => {
  it("re-renders when the API client points at another agent", () => {
    const { result } = renderHook(() => useActiveAgentAuthority());

    expect(result.current).toBe("https://agent-a.test");
    expect(authorityState.listeners.size).toBe(1);

    act(() => {
      authorityState.value = "https://agent-b.test";
      for (const onChange of authorityState.listeners) onChange();
    });

    expect(result.current).toBe("https://agent-b.test");
  });
});
