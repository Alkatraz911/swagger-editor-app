import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

import { LocaleSwitcher } from "./locale-switcher";

describe("LocaleSwitcher", () => {
  it("renders the available locales", () => {
    renderWithIntl(<LocaleSwitcher />);
    expect(screen.getByRole("option", { name: "EN" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "RU" })).toBeInTheDocument();
  });

  it("stores the chosen locale in a cookie and refreshes", () => {
    renderWithIntl(<LocaleSwitcher />);

    fireEvent.change(screen.getByLabelText("Language"), {
      target: { value: "ru" },
    });

    expect(document.cookie).toContain("NEXT_LOCALE=ru");
    expect(refresh).toHaveBeenCalledOnce();
  });
});
