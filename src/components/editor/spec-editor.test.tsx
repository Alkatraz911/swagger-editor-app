import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
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
      onMount?: () => void;
    }) {
      monacoPropsSpy(props);

      useEffect(() => {
        props.onMount?.();
      }, [props.onMount]);

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

  it("uses json language when the store format is json", () => {
    useSpecStore.setState({
      rawText: '{"openapi":"3.0.3"}',
      format: "json",
    });

    renderWithIntl(<SpecEditor />);

    expect(screen.getByTestId("monaco-mock")).toHaveAttribute(
      "data-language",
      "json",
    );
  });

  it("writes changed text back into the shared spec store", () => {
    renderWithIntl(<SpecEditor />);

    fireEvent.change(screen.getByTestId("monaco-mock"), {
      target: { value: '{"openapi":"3.0.3"}' },
    });

    expect(useSpecStore.getState().rawText).toBe('{"openapi":"3.0.3"}');
  });

  it("clears the store when Monaco reports an undefined value", () => {
    useSpecStore.setState({ rawText: "openapi: 3.0.3" });

    renderWithIntl(<SpecEditor />);

    const { onChange } = monacoPropsSpy.mock.calls.at(-1)![0];
    onChange?.(undefined);

    expect(useSpecStore.getState().rawText).toBe("");
  });

  it("marks the editor as ready when Monaco mounts", async () => {
    renderWithIntl(<SpecEditor />);

    expect(monacoPropsSpy.mock.calls[0][0].onMount).toBeTypeOf("function");

    await waitFor(() => {
      const loader = screen.getByText("Editor").closest("[aria-hidden]");
      expect(loader).toHaveAttribute("aria-hidden", "true");
    });
  });
});
