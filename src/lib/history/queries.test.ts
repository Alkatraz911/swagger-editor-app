import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestRow } from "@/lib/supabase/types";

const { requestsSelect, requestMaybeSingle } = vi.hoisted(() => ({
  requestsSelect: vi.fn(),
  requestMaybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => {
      if (table !== "requests") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: requestsSelect,
            eq: vi.fn(() => ({
              maybeSingle: requestMaybeSingle,
            })),
          })),
        })),
      };
    }),
  })),
}));

import { getUserRequest, getUserRequests } from "./queries";

const row: RequestRow = {
  id: "req-1",
  user_id: "user-1",
  created_at: "2026-07-06T10:00:00.000Z",
  method: "GET",
  url: "https://api.example.com/pets/1",
  endpoint_path: "/pets/1",
  status_code: 200,
  duration_ms: 120,
  request_size: 0,
  response_size: 42,
  error_detail: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getUserRequests", () => {
  it("returns request rows sorted by created_at desc", async () => {
    requestsSelect.mockResolvedValue({ data: [row], error: null });

    await expect(getUserRequests("user-1")).resolves.toEqual([row]);
    expect(requestsSelect).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });
});

describe("getUserRequest", () => {
  it("returns a single request scoped to the user", async () => {
    requestMaybeSingle.mockResolvedValue({ data: row, error: null });

    await expect(getUserRequest("user-1", "req-1")).resolves.toEqual(row);
  });
});
