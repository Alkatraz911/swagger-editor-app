import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { Footer } from "./footer";

describe("Footer", () => {
  it("renders a link to the About page", () => {
    renderWithIntl(<Footer />);

    const link = screen.getByRole("link", { name: /about/i });
    expect(link).toHaveAttribute("href", "/about");
  });
});
