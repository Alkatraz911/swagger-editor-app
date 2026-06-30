import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import ErrorBoundary from "./error";

describe("ErrorBoundary", () => {
  it("shows a friendly message and retries on click", () => {
    const reset = vi.fn();
    renderWithIntl(<ErrorBoundary error={new Error("boom")} reset={reset} />);

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
