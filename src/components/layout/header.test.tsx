import { describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/lib/auth/actions", () => ({ signOut: vi.fn() }));

import { Header } from "./header";

describe("Header", () => {
  it("shows Sign in / Sign up and History for guests", () => {
    renderWithIntl(<Header isAuthenticated={false} />);

    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /history/i })).toHaveAttribute(
      "href",
      "/history",
    );
    expect(
      screen.queryByRole("button", { name: /sign out/i }),
    ).not.toBeInTheDocument();
  });

  it("shows History / Sign out for authenticated users", () => {
    renderWithIntl(<Header isAuthenticated={true} />);

    expect(screen.getByRole("link", { name: /history/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign out/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /sign in/i }),
    ).not.toBeInTheDocument();
  });

  it("always shows the About link", () => {
    renderWithIntl(<Header isAuthenticated={false} />);
    expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
  });

  it("shrinks when the page is scrolled", () => {
    renderWithIntl(<Header isAuthenticated={false} />);

    act(() => {
      Object.defineProperty(window, "scrollY", {
        value: 100,
        configurable: true,
      });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(screen.getByRole("banner").className).toContain("h-12");
  });
});
