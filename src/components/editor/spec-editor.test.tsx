import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { useSpecStore } from "@/store/spec-store";
import { renderWithIntl } from "@/test/render-with-intl";

const { monacoPropsSpy } = vi.hoisted(() => ({
  monacoPropsSpy: vi.fn(),
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    return function MonacoEditorMock(props: {
      language?: string;
      value?: string;
      onChange?: (value?: string) => void;
    }) {
      monacoPropsSpy(props);

      return (
        <textarea
          data-testid="monaco-mock"
          data-language={props.language}
          value={props.value ?? ""}
          onChange={(event) => props.onChange?.(event.target.value)}
        />
      );
    };
  },
}));

import { SpecEditor } from "./spec-editor";

describe("SpecEditor", () => {
  beforeEach(() => {
    useSpecStore.getState().reset();
    monacoPropsSpy.mockClear();
  });

  it("renders Monaco with initial value from the store", () => {
    useSpecStore.setState({
      rawText: "openapi: 3.0.3",
      format: "yaml",
    });

    renderWithIntl(<SpecEditor />);

    const editor = screen.getByTestId("monaco-mock");
    expect(editor).toHaveValue("openapi: 3.0.3");
    expect(editor).toHaveAttribute("data-language", "yaml");
    expect(monacoPropsSpy).toHaveBeenCalled();
  });

  it("writes changed text back into the shared spec store", () => {
    renderWithIntl(<SpecEditor />);

    fireEvent.change(screen.getByTestId("monaco-mock"), {
      target: { value: '{"openapi":"3.0.3"}' },
    });

    expect(useSpecStore.getState().rawText).toBe('{"openapi":"3.0.3"}');
  });
});
