import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import enMessages from "../../../messages/en.json";
import { renderWithIntl } from "@/test/render-with-intl";
import type { RequestRow } from "@/lib/supabase/types";
import { RequestDetail } from "./request-detail";

const request: RequestRow = {
  id: "req-1",
  user_id: "user-1",
  created_at: "2026-07-06T10:15:00.000Z",
  method: "PUT",
  url: "https://api.example.com/posts/1",
  endpoint_path: "/posts/1",
  status_code: 404,
  duration_ms: 1500,
  request_size: 128,
  response_size: 64,
  error_detail: "Network timeout",
};

describe("RequestDetail", () => {
  it("shows all analytics fields recorded by the proxy", () => {
    renderWithIntl(<RequestDetail request={request} />);

    expect(screen.getAllByText("PUT").length).toBeGreaterThan(0);
    expect(screen.getAllByText("404").length).toBeGreaterThan(0);
    expect(screen.getByText("/posts/1")).toBeInTheDocument();
    expect(
      screen.getByText("https://api.example.com/posts/1"),
    ).toBeInTheDocument();
    expect(screen.getByText("Network timeout")).toBeInTheDocument();
    expect(screen.getByText("128 B")).toBeInTheDocument();
    expect(screen.getByText("64 B")).toBeInTheDocument();
    expect(screen.getByText("1.50 s")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: enMessages.history.backToHistory }),
    ).toHaveAttribute("href", "/history");
  });
});
