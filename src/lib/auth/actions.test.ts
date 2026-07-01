import { beforeEach, describe, expect, it, vi } from "vitest";

const { supaSignIn, supaSignUp, supaSignOut, redirect, revalidatePath } =
  vi.hoisted(() => ({
    supaSignIn: vi.fn(),
    supaSignUp: vi.fn(),
    supaSignOut: vi.fn(),
    redirect: vi.fn(),
    revalidatePath: vi.fn(),
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
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { signIn, signUp, signOut } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("signIn", () => {
  it("redirects to the main page on success", async () => {
    supaSignIn.mockResolvedValue({ error: null });
    await signIn("a@b.com", "secret");
    expect(supaSignIn).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "secret",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("returns the error and does not redirect on failure", async () => {
    supaSignIn.mockResolvedValue({ error: { message: "Invalid login" } });
    expect(await signIn("a@b.com", "x")).toEqual({ error: "Invalid login" });
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("signUp", () => {
  it("redirects to the main page on success", async () => {
    supaSignUp.mockResolvedValue({ error: null });
    await signUp("a@b.com", "secret");
    expect(supaSignUp).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "secret",
    });
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("returns the error and does not redirect on failure", async () => {
    supaSignUp.mockResolvedValue({ error: { message: "User exists" } });
    expect(await signUp("a@b.com", "x")).toEqual({ error: "User exists" });
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("signOut", () => {
  it("signs out and redirects to the main page", async () => {
    supaSignOut.mockResolvedValue({ error: null });
    await signOut();
    expect(supaSignOut).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
