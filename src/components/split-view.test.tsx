import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SplitView } from "./split-view";

function mockOrientation(portrait: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: portrait,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SplitView", () => {
  it("renders both panes in landscape", () => {
    mockOrientation(false);
    render(
      <SplitView start={<div>LEFT PANE</div>} end={<div>RIGHT PANE</div>} />,
    );

    expect(screen.getByText("LEFT PANE")).toBeInTheDocument();
    expect(screen.getByText("RIGHT PANE")).toBeInTheDocument();
  });

  it("renders both panes in portrait", () => {
    mockOrientation(true);
    render(
      <SplitView start={<div>TOP PANE</div>} end={<div>BOTTOM PANE</div>} />,
    );

    expect(screen.getByText("TOP PANE")).toBeInTheDocument();
    expect(screen.getByText("BOTTOM PANE")).toBeInTheDocument();
  });
});
