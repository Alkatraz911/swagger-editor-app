import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import enMessages from "../../../../messages/en.json";
import type { RequestRow } from "@/lib/supabase/types";

const { redirect, notFound } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

const { getUser } = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

const { getUserRequest } = vi.hoisted(() => ({
  getUserRequest: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect, notFound }));
vi.mock("@/lib/auth/get-user", () => ({ getUser }));
vi.mock("@/lib/history/queries", () => ({ getUserRequest }));
vi.mock("@/components/history/lazy-history", () => ({
  LazyRequestDetail: ({ request }: { request: RequestRow }) => (
    <div data-testid="request-detail">{request.url}</div>
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

import HistoryDetailPage from "./page";

const request: RequestRow = {
  id: "req-1",
  user_id: "user-1",
  created_at: "2026-07-06T10:00:00.000Z",
  method: "GET",
  url: "https://api.example.com/pets/1",
  endpoint_path: "/pets/1",
  status_code: 200,
  duration_ms: 100,
  request_size: 0,
  response_size: 42,
  error_detail: null,
};

describe("HistoryDetailPage", () => {
  it("redirects unauthenticated users to the main page", async () => {
    getUser.mockResolvedValue(null);

    await expect(
      HistoryDetailPage({ params: Promise.resolve({ id: "req-1" }) }),
    ).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("renders analytics for an existing request", async () => {
    getUser.mockResolvedValue({ id: "user-1" });
    getUserRequest.mockResolvedValue(request);

    render(
      await HistoryDetailPage({ params: Promise.resolve({ id: "req-1" }) }),
    );

    expect(screen.getByTestId("request-detail")).toHaveTextContent(
      "https://api.example.com/pets/1",
    );
    expect(getUserRequest).toHaveBeenCalledWith("user-1", "req-1");
    expect(
      screen.getByText(enMessages.history.detailTitle),
    ).toBeInTheDocument();
  });
});
