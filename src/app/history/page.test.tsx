import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import enMessages from "../../../messages/en.json";
import type { RequestRow } from "@/lib/supabase/types";

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

const { getUser } = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

const { getUserRequests } = vi.hoisted(() => ({
  getUserRequests: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth/get-user", () => ({ getUser }));
vi.mock("@/lib/history/queries", () => ({ getUserRequests }));
vi.mock("@/components/history/lazy-history", () => ({
  LazyHistoryList: ({ requests }: { requests: RequestRow[] }) => (
    <div data-testid="history-list">
      {requests.map((row) => row.id).join(",")}
    </div>
  ),
}));
vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace: string) => {
    const messages = enMessages[namespace as keyof typeof enMessages] as Record<
      string,
      unknown
    >;

    return (key: string) => {
      const parts = key.split(".");
      let value: unknown = messages;
      for (const part of parts) {
        value = (value as Record<string, unknown>)[part];
      }
      return value as string;
    };
  },
}));

import HistoryPage from "./page";

const requests: RequestRow[] = [
  {
    id: "req-new",
    user_id: "user-1",
    created_at: "2026-07-06T12:00:00.000Z",
    method: "GET",
    url: "https://api.example.com/a",
    endpoint_path: "/a",
    status_code: 200,
    duration_ms: 10,
    request_size: 0,
    response_size: 1,
    error_detail: null,
  },
  {
    id: "req-old",
    user_id: "user-1",
    created_at: "2026-07-06T10:00:00.000Z",
    method: "GET",
    url: "https://api.example.com/b",
    endpoint_path: "/b",
    status_code: 200,
    duration_ms: 20,
    request_size: 0,
    response_size: 2,
    error_detail: null,
  },
];

describe("HistoryPage", () => {
  it("redirects unauthenticated users to the main page", async () => {
    getUser.mockResolvedValue(null);

    await expect(HistoryPage()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("renders an empty state when there are no requests", async () => {
    getUser.mockResolvedValue({ id: "user-1" });
    getUserRequests.mockResolvedValue([]);

    render(await HistoryPage());

    expect(
      screen.getByText(enMessages.history.emptyMessage),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: enMessages.history.goToEditor }),
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("link", { name: enMessages.history.goToViewer }),
    ).toHaveAttribute("href", "/");
  });

  it("renders request history sorted newest first", async () => {
    getUser.mockResolvedValue({ id: "user-1" });
    getUserRequests.mockResolvedValue(requests);

    render(await HistoryPage());

    expect(screen.getByTestId("history-list")).toHaveTextContent(
      "req-new,req-old",
    );
    expect(getUserRequests).toHaveBeenCalledWith("user-1");
  });
});
