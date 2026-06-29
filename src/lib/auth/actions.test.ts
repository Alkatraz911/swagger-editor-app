import { beforeEach, describe, expect, it, vi } from "vitest";

const { supaSignIn, supaSignUp, supaSignOut } = vi.hoisted(() => ({
  supaSignIn: vi.fn(),
  supaSignUp: vi.fn(),
  supaSignOut: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: supaSignIn,
      signUp: supaSignUp,
      signOut: supaSignOut,
    },
  })),
}));

import { signIn, signUp, signOut } from "./actions";

beforeEach(() => {
  supaSignIn.mockReset();
  supaSignUp.mockReset();
  supaSignOut.mockReset();
});

describe("signIn", () => {
  it("passes credentials and returns no error on success", async () => {
    supaSignIn.mockResolvedValue({ error: null });
    const result = await signIn("a@b.com", "secret");
    expect(supaSignIn).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "secret",
    });
    expect(result).toEqual({ error: null });
  });

  it("maps the Supabase error message", async () => {
    supaSignIn.mockResolvedValue({ error: { message: "Invalid login" } });
    expect(await signIn("a@b.com", "x")).toEqual({ error: "Invalid login" });
  });
});

describe("signUp", () => {
  it("passes credentials and returns no error on success", async () => {
    supaSignUp.mockResolvedValue({ error: null });
    const result = await signUp("a@b.com", "secret");
    expect(supaSignUp).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "secret",
    });
    expect(result).toEqual({ error: null });
  });

  it("maps the Supabase error message", async () => {
    supaSignUp.mockResolvedValue({ error: { message: "User exists" } });
    expect(await signUp("a@b.com", "x")).toEqual({ error: "User exists" });
  });
});

describe("signOut", () => {
  it("calls Supabase signOut and returns no error", async () => {
    supaSignOut.mockResolvedValue({ error: null });
    expect(await signOut()).toEqual({ error: null });
    expect(supaSignOut).toHaveBeenCalledOnce();
  });
});
