import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import type { RequestRow } from "@/lib/supabase/types";
import { HistoryList } from "./history-list";

const requests: RequestRow[] = [
  {
    id: "req-new",
    user_id: "user-1",
    created_at: "2026-07-06T12:00:00.000Z",
    method: "POST",
    url: "https://api.example.com/posts",
    endpoint_path: "/posts",
    status_code: 201,
    duration_ms: 80,
    request_size: 24,
    response_size: 120,
    error_detail: null,
  },
  {
    id: "req-old",
    user_id: "user-1",
    created_at: "2026-07-06T10:00:00.000Z",
    method: "GET",
    url: "https://api.example.com/posts/1",
    endpoint_path: "/posts/1",
    status_code: 200,
    duration_ms: 40,
    request_size: 0,
    response_size: 64,
    error_detail: null,
  },
];

describe("HistoryList", () => {
  it("renders requests and links to detail pages", () => {
    renderWithIntl(<HistoryList requests={requests} />);

    expect(screen.getByText("POST")).toBeInTheDocument();
    expect(screen.getByText("/posts")).toBeInTheDocument();
    expect(screen.getByText("201")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "View details" })).toHaveLength(
      2,
    );
    expect(
      screen.getAllByRole("link", { name: "View details" })[0],
    ).toHaveAttribute("href", "/history/req-new");
  });
});
