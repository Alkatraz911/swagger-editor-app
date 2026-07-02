import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { useSpecStore } from "@/store/spec-store";
import type { OpenApiDocument } from "@/store/spec-store";
import { SpecViewer } from "./spec-viewer";

const sampleSpec: OpenApiDocument = {
  openapi: "3.0.0",
  paths: {
    "/users": {
      get: {
        summary: "List users",
        responses: { "200": { description: "OK" } },
      },
    },
  },
};

beforeEach(() => {
  useSpecStore.getState().reset();
});

describe("SpecViewer", () => {
  it("shows the empty state when no spec is parsed", () => {
    renderWithIntl(<SpecViewer />);
    expect(screen.getByText("No specification yet")).toBeInTheDocument();
  });

  it("shows parse errors when the spec is invalid", () => {
    useSpecStore.getState().setParsedResult({
      parsedSpec: null,
      errors: ["Unexpected token"],
    });
    renderWithIntl(<SpecViewer />);
    expect(
      screen.getByText("The specification is not valid"),
    ).toBeInTheDocument();
    expect(screen.getByText("Unexpected token")).toBeInTheDocument();
  });

  it("lists endpoints and expands details on selection", () => {
    useSpecStore
      .getState()
      .setParsedResult({ parsedSpec: sampleSpec, errors: [] });
    renderWithIntl(<SpecViewer />);

    fireEvent.click(screen.getByRole("button", { name: /List users/ }));

    expect(screen.getByText("Responses")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("collapses details when the same endpoint is clicked again", () => {
    useSpecStore
      .getState()
      .setParsedResult({ parsedSpec: sampleSpec, errors: [] });
    renderWithIntl(<SpecViewer />);

    const row = screen.getByRole("button", { name: /List users/ });
    fireEvent.click(row);
    expect(row).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(row);
    expect(row).toHaveAttribute("aria-expanded", "false");
  });

  it("shows a no-endpoints message when the spec has none", () => {
    useSpecStore.getState().setParsedResult({
      parsedSpec: { openapi: "3.0.0", paths: {} },
      errors: [],
    });
    renderWithIntl(<SpecViewer />);
    expect(
      screen.getByText("The specification has no endpoints."),
    ).toBeInTheDocument();
  });
});
