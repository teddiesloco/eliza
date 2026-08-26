/**
 * Component coverage for Knowledge availability states on web and native
 * mobile when the documents route is absent. The harness uses the real
 * DocumentsView state machine with only its transport and app context mocked.
 */
// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/client-types-core";
import { __resetResourceCache } from "../../hooks/resource-cache";

const appMock = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
const platformMock = vi.hoisted(() => ({ isNative: false }));
const clientMock = vi.hoisted(() => ({
  getDocumentFacetCounts: vi.fn(),
  listDocuments: vi.fn(),
}));

vi.mock("../../state", () => ({
  useAppSelector: (selector: (value: Record<string, unknown>) => unknown) =>
    selector(appMock.value),
  useTranslation: () => ({ t: appMock.value.t }),
}));
vi.mock("../../api/client", () => ({ client: clientMock }));
vi.mock("../../platform", () => ({
  get isNative() {
    return platformMock.isNative;
  },
}));
vi.mock("../../state/view-chat-binding", () => ({
  useRegisterViewChatBinding: () => {},
}));

import { DocumentsView } from "./DocumentsView";

function t(key: string, options?: { defaultValue?: string }) {
  return options?.defaultValue ?? key;
}

function missingDocumentsRoute(): ApiError {
  return new ApiError({
    kind: "http",
    path: "/api/documents",
    message: "Not Found",
    status: 404,
  });
}

function sharedDocumentsRuntimeUnavailable(): ApiError {
  return new ApiError({
    kind: "http",
    path: "/api/documents",
    message:
      "Knowledge documents require a dedicated agent runtime; this shared agent does not have a document ingest store.",
    status: 503,
    code: "documents_runtime_unavailable",
    data: {
      success: false,
      code: "documents_runtime_unavailable",
      retryable: false,
    },
  });
}

beforeEach(() => {
  __resetResourceCache();
  platformMock.isNative = false;
  appMock.value = { t, setActionNotice: vi.fn() };
  clientMock.listDocuments.mockReset();
  clientMock.getDocumentFacetCounts.mockReset();
  clientMock.listDocuments.mockRejectedValue(missingDocumentsRoute());
  clientMock.getDocumentFacetCounts.mockRejectedValue(missingDocumentsRoute());
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("DocumentsView availability", () => {
  it("recovers when the documents route appears during deferred startup", async () => {
    vi.useFakeTimers();
    clientMock.listDocuments
      .mockRejectedValueOnce(missingDocumentsRoute())
      .mockResolvedValue({ documents: [] });
    clientMock.getDocumentFacetCounts.mockResolvedValue({
      counts: {
        all: 0,
        doc: 0,
        image: 0,
        audio: 0,
        video: 0,
        transcript: 0,
      },
    });

    render(<DocumentsView fileInputId="knowledge-upload" />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(clientMock.listDocuments).toHaveBeenCalledTimes(2);
    expect(screen.getByText("No knowledge yet")).toBeTruthy();
    expect(
      screen.queryByText("This agent doesn't expose a Knowledge library yet."),
    ).toBeNull();
  });

  it("shows a calm capability error on web without empty-state CTAs", async () => {
    vi.useFakeTimers();
    render(<DocumentsView fileInputId="knowledge-upload" />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4_000);
    });

    expect(
      screen.getByText("This agent doesn't expose a Knowledge library yet."),
    ).toBeTruthy();
    expect(
      screen.queryByText(/Knowledge isn't available on this device/i),
    ).toBeNull();
    expect(screen.queryByText("No knowledge yet")).toBeNull();
    expect(screen.queryByTestId("knowledge-add")).toBeNull();
    expect(screen.queryByRole("button", { name: "common.retry" })).toBeNull();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(appMock.value.setActionNotice).not.toHaveBeenCalled();
  });

  it("keeps the device-unavailable state for native mobile only", async () => {
    platformMock.isNative = true;
    render(<DocumentsView fileInputId="knowledge-upload" />);

    expect(
      await screen.findByText("Open the web or desktop app to manage it."),
    ).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByText("No knowledge yet")).toBeNull();
      expect(screen.queryByTestId("knowledge-add")).toBeNull();
    });
    expect(
      screen.queryByText("This agent doesn't expose a Knowledge library yet."),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "common.retry" })).toBeNull();
  });

  it("shows an honest Shared-runtime capability state without retrying", async () => {
    clientMock.listDocuments.mockRejectedValue(
      sharedDocumentsRuntimeUnavailable(),
    );
    clientMock.getDocumentFacetCounts.mockRejectedValue(
      sharedDocumentsRuntimeUnavailable(),
    );

    render(<DocumentsView fileInputId="knowledge-upload" />);

    expect(
      await screen.findByText("Knowledge needs a Dedicated agent"),
    ).toBeTruthy();
    expect(
      screen.getByText("Connect a Dedicated agent to add and search files."),
    ).toBeTruthy();
    expect(screen.queryByText("No knowledge yet")).toBeNull();
    expect(screen.queryByTestId("knowledge-add")).toBeNull();
    expect(screen.queryByRole("button", { name: "common.retry" })).toBeNull();
  });
});
