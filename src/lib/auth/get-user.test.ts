import { beforeEach, describe, expect, it, vi } from "vitest";

const { authGetUser } = vi.hoisted(() => ({ authGetUser: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: authGetUser } })),
}));

import { getUser } from "./get-user";

beforeEach(() => {
  authGetUser.mockReset();
});

describe("getUser", () => {
  it("returns the user when signed in", async () => {
    authGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    expect(await getUser()).toEqual({ id: "u1" });
  });

  it("returns null when not signed in", async () => {
    authGetUser.mockResolvedValue({ data: { user: null } });
    expect(await getUser()).toBeNull();
  });
});
