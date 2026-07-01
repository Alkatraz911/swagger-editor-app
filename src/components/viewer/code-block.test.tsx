import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CodeBlock } from "./code-block";

describe("CodeBlock", () => {
  it("pretty-prints objects as JSON", () => {
    render(<CodeBlock value={{ a: 1 }} />);
    expect(screen.getByText(/"a": 1/)).toBeInTheDocument();
  });

  it("renders string values verbatim", () => {
    render(<CodeBlock value="plain text" />);
    expect(screen.getByText("plain text")).toBeInTheDocument();
  });

  it("falls back to String() for non-serializable values", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    render(<CodeBlock value={circular} />);
    expect(screen.getByText("[object Object]")).toBeInTheDocument();
  });
});
