/** Verifies the responsive Trajectories header and clearance ownership. */
// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TrajectoriesView } from "./TrajectoriesView";

const mediaQueryState = vi.hoisted(() => ({ mobile: true }));
const clientMock = vi.hoisted(() => ({
  getTrajectories: vi.fn(),
  getTrajectoryConfig: vi.fn(),
}));

vi.mock("../../agent-surface", () => ({
  useAgentElement: () => ({ agentProps: {}, ref: null }),
}));

vi.mock("../../api/client", () => ({ client: clientMock }));

vi.mock("../../hooks/resource-cache", () => ({
  getCached: () => null,
  setCached: vi.fn(),
}));

vi.mock("../../hooks/useDocumentVisibility", () => ({
  useIntervalWhenDocumentVisible: () => undefined,
}));

vi.mock("../../hooks/useMediaQuery", () => ({
  useMediaQuery: () => mediaQueryState.mobile,
}));

vi.mock("../../state", () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({
      setActionNotice: vi.fn(),
      t: (_key: string, options?: { defaultValue?: string }) =>
        options?.defaultValue ?? "",
    }),
}));

vi.mock("../../state/view-chat-binding", () => ({
  useRegisterViewChatBinding: () => undefined,
}));

vi.mock("../views/ShellViewAgentSurface", () => ({
  ShellViewAgentSurface: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("./TrajectoryDetailView", () => ({
  TrajectoryDetailView: ({ trajectoryId }: { trajectoryId: string }) => (
    <div data-testid="trajectory-detail">{trajectoryId}</div>
  ),
}));

const trajectory = {
  id: "run-1",
  createdAt: "2026-08-25T12:00:00.000Z",
  source: "chat",
  status: "completed",
  scenarioId: null,
  batchId: null,
  llmCallCount: 1,
  providerAccessCount: 0,
  totalPromptTokens: 10,
  totalCompletionTokens: 5,
  durationMs: 1200,
};

describe("TrajectoriesView header lifecycle", () => {
  beforeEach(() => {
    mediaQueryState.mobile = true;
    clientMock.getTrajectories.mockResolvedValue({
      trajectories: [trajectory],
      total: 1,
      offset: 0,
      limit: 50,
    });
    clientMock.getTrajectoryConfig.mockRejectedValue({ status: 404 });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("replaces the mobile list header with one detail header and keeps clearance at the router boundary", async () => {
    const onSelectTrajectory = vi.fn();
    const rendered = render(
      <TrajectoriesView
        selectedTrajectoryId={null}
        onSelectTrajectory={onSelectTrajectory}
      />,
    );

    expect(screen.getByRole("heading", { name: "Trajectories" })).toBeTruthy();
    await waitFor(() => screen.getByText("1 recorded run"));

    rendered.rerender(
      <TrajectoriesView
        selectedTrajectoryId="run-1"
        onSelectTrajectory={onSelectTrajectory}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Run details" }),
    ).toBeTruthy();
    expect(screen.getAllByTestId("view-header")).toHaveLength(1);
    expect(screen.getByTestId("trajectory-detail").textContent).toBe("run-1");

    fireEvent.click(screen.getByRole("button", { name: "Back to activity" }));
    expect(onSelectTrajectory).toHaveBeenLastCalledWith(null);

    for (const scroller of rendered.container.querySelectorAll<HTMLElement>(
      ".overflow-y-auto",
    )) {
      expect(scroller.className).not.toContain("--eliza-chat-clearance");
      expect(scroller.className).not.toContain("--eliza-mobile-nav-offset");
      expect(scroller.className).not.toContain("--safe-area-bottom");
    }
  });
});
