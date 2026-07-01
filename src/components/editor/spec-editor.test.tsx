import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { useSpecStore } from "@/store/spec-store";
import { renderWithIntl } from "@/test/render-with-intl";

function mockColorScheme(isDark: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: isDark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
}

const { monacoPropsSpy } = vi.hoisted(() => ({
  monacoPropsSpy: vi.fn(),
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    return function MonacoEditorMock(props: {
      language?: string;
      theme?: string;
      value?: string;
      onChange?: (value?: string) => void;
      onMount?: () => void;
    }) {
      monacoPropsSpy(props);

      return (
        <textarea
          data-testid="monaco-mock"
          data-language={props.language}
          data-theme={props.theme}
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
    mockColorScheme(false);
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

  it("uses dark Monaco theme for dark system scheme", () => {
    mockColorScheme(true);
    renderWithIntl(<SpecEditor />);
    expect(screen.getByTestId("monaco-mock")).toHaveAttribute(
      "data-theme",
      "vs-dark",
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

    const onMount = monacoPropsSpy.mock.calls[0][0].onMount;
    expect(onMount).toBeTypeOf("function");

    const initialLoader = screen.getByText("Editor").closest("[aria-hidden]");
    expect(initialLoader).toHaveAttribute("aria-hidden", "false");

    onMount?.();

    await waitFor(() => {
      const loader = screen.getByText("Editor").closest("[aria-hidden]");
      expect(loader).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("keeps editor mounted when locale changes", async () => {
    useSpecStore.setState({
      rawText: "openapi: 3.0.3",
      format: "yaml",
    });

    const { rerenderWithLocale } = renderWithIntl(<SpecEditor />, {
      locale: "en",
    });

    const onMount = monacoPropsSpy.mock.calls[0][0].onMount;
    onMount?.();

    await waitFor(() => {
      const loader = screen.getByText("Editor").closest("[aria-hidden]");
      expect(loader).toHaveAttribute("aria-hidden", "true");
    });

    const mountCallsBefore = monacoPropsSpy.mock.calls.length;

    rerenderWithLocale(<SpecEditor />, { locale: "ru" });

    const loader = screen.getByText("Редактор").closest("[aria-hidden]");
    expect(loader).toHaveAttribute("aria-hidden", "true");
    expect(monacoPropsSpy.mock.calls.length).toBe(mountCallsBefore + 1);
  });
});
