import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import enMessages from "../../../messages/en.json";
import { HistoryEmptyState } from "./history-empty-state";

describe("HistoryEmptyState", () => {
  it("renders the empty message and editor/viewer links", () => {
    render(
      <HistoryEmptyState
        message={enMessages.history.emptyMessage}
        editorLinkLabel={enMessages.history.goToEditor}
        viewerLinkLabel={enMessages.history.goToViewer}
        editorHref="/editor"
        viewerHref="/viewer"
      />,
    );

    expect(
      screen.getByText(enMessages.history.emptyMessage),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: enMessages.history.goToEditor }),
    ).toHaveAttribute("href", "/editor");
    expect(
      screen.getByRole("link", { name: enMessages.history.goToViewer }),
    ).toHaveAttribute("href", "/viewer");
  });
});
