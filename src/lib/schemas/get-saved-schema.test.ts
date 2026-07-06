import { beforeEach, describe, expect, it, vi } from "vitest";

const { maybeSingle, eq, select, from, createClient } = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient,
}));

import { getSavedSchema } from "./get-saved-schema";

beforeEach(() => {
  maybeSingle.mockReset();
  eq.mockReset();
  select.mockReset();
  from.mockReset();
  createClient.mockReset();

  select.mockReturnValue({ eq });
  eq.mockReturnValue({ maybeSingle });
  from.mockReturnValue({ select });
  createClient.mockResolvedValue({ from });
});

describe("getSavedSchema", () => {
  it("returns content and format when a row exists", async () => {
    maybeSingle.mockResolvedValue({
      data: { content: "openapi: 3.0.3", format: "yaml" },
      error: null,
    });

    await expect(getSavedSchema("u1")).resolves.toEqual({
      content: "openapi: 3.0.3",
      format: "yaml",
    });

    expect(from).toHaveBeenCalledWith("schemas");
    expect(select).toHaveBeenCalledWith("content, format");
    expect(eq).toHaveBeenCalledWith("user_id", "u1");
    expect(maybeSingle).toHaveBeenCalled();
  });

  it("returns null when no row exists", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(getSavedSchema("u1")).resolves.toBeNull();
  });

  it("returns null when the query fails", async () => {
    maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "query failed" },
    });

    await expect(getSavedSchema("u1")).resolves.toBeNull();
  });
});
