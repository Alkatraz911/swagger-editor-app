import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { useSpecStore } from "@/store/spec-store";
import { renderWithIntl } from "@/test/render-with-intl";

function mockColorScheme(isDark: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: isDark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
}

const {
  monacoPropsSpy,
  convertSpecSpy,
  parseSpecSpy,
  validateSpecSpy,
  setModelMarkersSpy,
} = vi.hoisted(() => ({
  monacoPropsSpy: vi.fn(),
  convertSpecSpy: vi.fn(),
  parseSpecSpy: vi.fn(),
  validateSpecSpy: vi.fn(),
  setModelMarkersSpy: vi.fn(),
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    return function MonacoEditorMock(props: {
      language?: string;
      theme?: string;
      value?: string;
      onChange?: (value?: string) => void;
      onMount?: (editor?: unknown, monaco?: unknown) => void;
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

vi.mock("@/lib/openapi/parse", () => ({
  parseSpec: (...args: Parameters<typeof parseSpecSpy>) =>
    parseSpecSpy(...args),
  validateSpec: (...args: Parameters<typeof validateSpecSpy>) =>
    validateSpecSpy(...args),
}));

vi.mock("@/lib/openapi/convert", () => ({
  convertSpec: (...args: Parameters<typeof convertSpecSpy>) =>
    convertSpecSpy(...args),
}));

import { SpecEditor } from "./spec-editor";

function mountMockEditor() {
  const onMount = monacoPropsSpy.mock.calls.at(-1)?.[0]?.onMount;

  act(() => {
    onMount?.();
  });
}

describe("SpecEditor", () => {
  beforeEach(() => {
    vi.useRealTimers();
    useSpecStore.getState().reset();
    monacoPropsSpy.mockClear();
    mockColorScheme(false);
    convertSpecSpy.mockReset();
    parseSpecSpy.mockReset();
    setModelMarkersSpy.mockReset();
    validateSpecSpy.mockReset();
    parseSpecSpy.mockReturnValue({
      data: { openapi: "3.0.0", info: { title: "Mock", version: "1.0.0" } },
      error: null,
    });
    convertSpecSpy.mockReturnValue({
      text: '{\n  "openapi": "3.0.0"\n}\n',
      error: null,
    });
    validateSpecSpy.mockResolvedValue([]);
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

  it("switches format and replaces editor text when conversion succeeds", async () => {
    vi.useFakeTimers();
    useSpecStore.setState({
      rawText: "openapi: 3.0.3",
      format: "yaml",
      parsedSpec: { openapi: "3.0.3" },
      errors: ["Old error"],
    });
    convertSpecSpy.mockReturnValue({
      text: '{\n  "openapi": "3.0.3"\n}\n',
      error: null,
    });

    renderWithIntl(<SpecEditor />);
    mountMockEditor();

    fireEvent.click(screen.getByTestId("format-switch-button"));

    expect(convertSpecSpy).toHaveBeenCalledWith(
      "openapi: 3.0.3",
      "yaml",
      "json",
    );
    expect(useSpecStore.getState().format).toBe("json");
    expect(useSpecStore.getState().rawText).toBe(
      '{\n  "openapi": "3.0.3"\n}\n',
    );
    expect(useSpecStore.getState().parsedSpec).toMatchObject({
      openapi: "3.0.3",
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(useSpecStore.getState().errors).toEqual([]);

    vi.useRealTimers();
  });

  it("disables the format switch button when input cannot be parsed", () => {
    useSpecStore.setState({
      rawText: '{"openapi":"3.0.3"',
      format: "json",
    });
    parseSpecSpy.mockReturnValue({
      data: null,
      error: "Unexpected end of JSON input",
    });

    renderWithIntl(<SpecEditor />);
    mountMockEditor();

    const button = screen.getByTestId("format-switch-button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute(
      "title",
      "Fix syntax issues before switching format.",
    );
  });

  it("shows a fallback conversion error when convertSpec returns no details", () => {
    useSpecStore.setState({
      rawText: "openapi: 3.0.3",
      format: "yaml",
      parsedSpec: { openapi: "3.0.3" },
      errors: [],
    });
    convertSpecSpy.mockReturnValue({
      text: null,
      error: null,
    });

    renderWithIntl(<SpecEditor />);
    mountMockEditor();

    fireEvent.click(screen.getByTestId("format-switch-button"));

    expect(useSpecStore.getState().format).toBe("yaml");
    expect(useSpecStore.getState().errors).toEqual([
      "Could not convert between formats: Unknown conversion error.",
    ]);
  });

  it("shows conversion errors without changing the active format", () => {
    useSpecStore.setState({
      rawText: "openapi: 3.0.3",
      format: "yaml",
      parsedSpec: { openapi: "3.0.3" },
      errors: [],
    });
    convertSpecSpy.mockReturnValue({
      text: null,
      error: "Unexpected end of JSON input",
    });

    renderWithIntl(<SpecEditor />);
    mountMockEditor();

    fireEvent.click(screen.getByTestId("format-switch-button"));

    expect(useSpecStore.getState().format).toBe("yaml");
    expect(useSpecStore.getState().rawText).toBe("openapi: 3.0.3");
    expect(useSpecStore.getState().parsedSpec).toBeNull();
    expect(useSpecStore.getState().errors).toEqual([
      "Could not convert between formats: Unexpected end of JSON input",
    ]);
  });

  it("marks the editor as ready when Monaco mounts", async () => {
    renderWithIntl(<SpecEditor />);

    const onMount = monacoPropsSpy.mock.calls[0][0].onMount;
    expect(onMount).toBeTypeOf("function");

    const initialLoader = screen.getByText("Editor").closest("[aria-hidden]");
    expect(initialLoader).toHaveAttribute("aria-hidden", "false");

    mountMockEditor();

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

  it("publishes parsedSpec after debounce for valid input", async () => {
    vi.useFakeTimers();
    parseSpecSpy.mockReturnValue({
      data: {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {},
      },
      error: null,
    });
    validateSpecSpy.mockResolvedValue([]);

    renderWithIntl(<SpecEditor />);

    fireEvent.change(screen.getByTestId("monaco-mock"), {
      target: {
        value:
          '{"openapi":"3.0.0","info":{"title":"Test API","version":"1.0.0"},"paths":{}}',
      },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(useSpecStore.getState().parsedSpec).toMatchObject({
      openapi: "3.0.0",
    });
    expect(useSpecStore.getState().errors).toEqual([]);

    vi.useRealTimers();
  });

  it("stores parse errors and clears parsedSpec", async () => {
    vi.useFakeTimers();
    useSpecStore.setState({
      parsedSpec: { openapi: "3.0.0" },
      errors: [],
    });
    parseSpecSpy.mockReturnValue({
      data: null,
      error: "Unexpected end of JSON input",
    });

    renderWithIntl(<SpecEditor />);

    fireEvent.change(screen.getByTestId("monaco-mock"), {
      target: { value: '{"openapi":"3.0.0"' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(useSpecStore.getState().parsedSpec).toBeNull();
    expect(useSpecStore.getState().errors).toEqual([
      "Unexpected end of JSON input",
    ]);
    expect(validateSpecSpy).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("stores validation errors and clears parsedSpec", async () => {
    vi.useFakeTimers();
    parseSpecSpy.mockReturnValue({
      data: {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {},
      },
      error: null,
    });
    validateSpecSpy.mockResolvedValue([
      "Swagger schema validation failed: missing paths",
    ]);

    renderWithIntl(<SpecEditor />);

    fireEvent.change(screen.getByTestId("monaco-mock"), {
      target: {
        value:
          '{"openapi":"3.0.0","info":{"title":"Test API","version":"1.0.0"},"paths":{}}',
      },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(useSpecStore.getState().parsedSpec).toBeNull();
    expect(useSpecStore.getState().errors).toEqual([
      "Swagger schema validation failed: missing paths",
    ]);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("clears parsed result when editor content is empty", async () => {
    vi.useFakeTimers();
    useSpecStore.setState({
      rawText: '{"openapi":"3.0.0"}',
      parsedSpec: { openapi: "3.0.0" },
      errors: ["old error"],
    });

    renderWithIntl(<SpecEditor />);

    fireEvent.change(screen.getByTestId("monaco-mock"), {
      target: { value: "   " },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(useSpecStore.getState().parsedSpec).toBeNull();
    expect(useSpecStore.getState().errors).toEqual([]);

    vi.useRealTimers();
  });

  it("syncs store format when detected format differs from stored format", async () => {
    vi.useFakeTimers();
    useSpecStore.setState({
      rawText: "openapi: 3.0.3",
      format: "json",
    });

    renderWithIntl(<SpecEditor />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(useSpecStore.getState().format).toBe("yaml");

    vi.useRealTimers();
  });

  it("keeps a fixed-height toolbar before and after Monaco mounts", () => {
    renderWithIntl(<SpecEditor />);

    const toolbar = screen.getByTestId("editor-toolbar");
    expect(toolbar).toHaveClass("h-10");
    expect(
      screen.queryByTestId("format-switch-button"),
    ).not.toBeInTheDocument();

    mountMockEditor();

    expect(screen.getByTestId("format-switch-button")).toBeInTheDocument();
    expect(screen.getByTestId("editor-toolbar")).toHaveClass("h-10");
  });

  it("ignores stale validation results after rapid edits", async () => {
    vi.useFakeTimers();
    const validSpec = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      paths: {},
    };
    parseSpecSpy.mockReturnValue({
      data: validSpec,
      error: null,
    });

    let resolveStaleValidation: (errors: string[]) => void;
    validateSpecSpy
      .mockImplementationOnce(
        () =>
          new Promise<string[]>((resolve) => {
            resolveStaleValidation = resolve;
          }),
      )
      .mockResolvedValue([]);

    renderWithIntl(<SpecEditor />);

    fireEvent.change(screen.getByTestId("monaco-mock"), {
      target: {
        value:
          '{"openapi":"3.0.0","info":{"title":"First draft","version":"1.0.0"},"paths":{}}',
      },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    fireEvent.change(screen.getByTestId("monaco-mock"), {
      target: {
        value:
          '{"openapi":"3.0.0","info":{"title":"Test API","version":"1.0.0"},"paths":{}}',
      },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    await act(async () => {
      resolveStaleValidation!(["Stale validation error"]);
      await Promise.resolve();
    });

    expect(useSpecStore.getState().errors).toEqual([]);
    expect(useSpecStore.getState().parsedSpec).toMatchObject({
      openapi: "3.0.0",
    });

    vi.useRealTimers();
  });

  it("uses fallback message when parse fails without an error string", async () => {
    vi.useFakeTimers();
    parseSpecSpy.mockReturnValue({
      data: null,
      error: null,
    });

    renderWithIntl(<SpecEditor />);

    fireEvent.change(screen.getByTestId("monaco-mock"), {
      target: { value: "not valid" },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(useSpecStore.getState().errors).toEqual(["failedToParse"]);

    vi.useRealTimers();
  });

  it("switches format without conversion when editor is empty", () => {
    useSpecStore.setState({
      rawText: "",
      format: "yaml",
      parsedSpec: { openapi: "3.0.3" },
      errors: ["old error"],
    });

    renderWithIntl(<SpecEditor />);
    mountMockEditor();

    fireEvent.click(screen.getByTestId("format-switch-button"));

    expect(convertSpecSpy).not.toHaveBeenCalled();
    expect(useSpecStore.getState().parsedSpec).toBeNull();
    expect(useSpecStore.getState().errors).toEqual([]);
  });

  it("clears Monaco markers on unmount", () => {
    const model = {};
    const editor = {
      getModel: () => model,
    };
    const monaco = {
      MarkerSeverity: { Error: 8 },
      editor: { setModelMarkers: setModelMarkersSpy },
    };

    const { unmount } = renderWithIntl(<SpecEditor />);
    monacoPropsSpy.mock.calls[0][0].onMount?.(editor, monaco);

    unmount();

    expect(setModelMarkersSpy).toHaveBeenCalledWith(
      model,
      "openapi-validation",
      [],
    );
  });

  it("skips marker updates when Monaco has no model", async () => {
    vi.useFakeTimers();
    parseSpecSpy.mockReturnValue({
      data: {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {},
      },
      error: null,
    });
    validateSpecSpy.mockResolvedValue(["Validation failed"]);

    renderWithIntl(<SpecEditor />);

    const editor = {
      getModel: () => null,
    };
    const monaco = {
      MarkerSeverity: { Error: 8 },
      editor: { setModelMarkers: setModelMarkersSpy },
    };

    monacoPropsSpy.mock.calls[0][0].onMount?.(editor, monaco);
    setModelMarkersSpy.mockClear();

    fireEvent.change(screen.getByTestId("monaco-mock"), {
      target: {
        value:
          '{"openapi":"3.0.0","info":{"title":"Test API","version":"1.0.0"},"paths":{}}',
      },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(setModelMarkersSpy).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("writes Monaco markers for validation errors", async () => {
    vi.useFakeTimers();
    parseSpecSpy.mockReturnValue({
      data: {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {},
      },
      error: null,
    });
    validateSpecSpy.mockResolvedValue([
      "Validation failed at line 2, column 4",
    ]);

    renderWithIntl(<SpecEditor />);

    const model = {
      getLineCount: () => 10,
      getLineMaxColumn: () => 120,
    };
    const editor = {
      getModel: () => model,
    };
    const monaco = {
      MarkerSeverity: { Error: 8 },
      editor: { setModelMarkers: setModelMarkersSpy },
    };

    monacoPropsSpy.mock.calls[0][0].onMount?.(editor, monaco);

    fireEvent.change(screen.getByTestId("monaco-mock"), {
      target: {
        value:
          '{"openapi":"3.0.0","info":{"title":"Test API","version":"1.0.0"},"paths":{}}',
      },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(setModelMarkersSpy).toHaveBeenLastCalledWith(
      model,
      "openapi-validation",
      expect.arrayContaining([
        expect.objectContaining({
          message: "Validation failed at line 2, column 4",
          startLineNumber: 2,
          startColumn: 4,
        }),
      ]),
    );

    vi.useRealTimers();
  });

  it("maps tuple-style error locations to Monaco markers", async () => {
    vi.useFakeTimers();
    parseSpecSpy.mockReturnValue({
      data: {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {},
      },
      error: null,
    });
    validateSpecSpy.mockResolvedValue(["Validation failed at (3:7)"]);

    renderWithIntl(<SpecEditor />);

    const model = {
      getLineCount: () => 10,
      getLineMaxColumn: () => 120,
    };
    const editor = {
      getModel: () => model,
    };
    const monaco = {
      MarkerSeverity: { Error: 8 },
      editor: { setModelMarkers: setModelMarkersSpy },
    };

    monacoPropsSpy.mock.calls[0][0].onMount?.(editor, monaco);

    fireEvent.change(screen.getByTestId("monaco-mock"), {
      target: {
        value:
          '{"openapi":"3.0.0","info":{"title":"Test API","version":"1.0.0"},"paths":{}}',
      },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(setModelMarkersSpy).toHaveBeenLastCalledWith(
      model,
      "openapi-validation",
      expect.arrayContaining([
        expect.objectContaining({
          message: "Validation failed at (3:7)",
          startLineNumber: 3,
          startColumn: 7,
        }),
      ]),
    );

    vi.useRealTimers();
  });

  it("maps position-style error locations to Monaco markers", async () => {
    vi.useFakeTimers();
    const rawText = "abc\ndef";
    useSpecStore.setState({ rawText, format: "yaml" });
    parseSpecSpy.mockReturnValue({
      data: {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {},
      },
      error: null,
    });
    validateSpecSpy.mockResolvedValue(["Syntax error at position 5"]);

    renderWithIntl(<SpecEditor />);

    const model = {
      getLineCount: () => 10,
      getLineMaxColumn: (line: number) => (line === 2 ? 3 : 120),
    };
    const editor = {
      getModel: () => model,
    };
    const monaco = {
      MarkerSeverity: { Error: 8 },
      editor: { setModelMarkers: setModelMarkersSpy },
    };

    monacoPropsSpy.mock.calls[0][0].onMount?.(editor, monaco);

    fireEvent.change(screen.getByTestId("monaco-mock"), {
      target: { value: rawText },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(setModelMarkersSpy).toHaveBeenLastCalledWith(
      model,
      "openapi-validation",
      expect.arrayContaining([
        expect.objectContaining({
          message: "Syntax error at position 5",
          startLineNumber: 2,
          startColumn: 2,
        }),
      ]),
    );

    vi.useRealTimers();
  });

  it("defaults marker location to line 1 column 1 for unrecognized errors", async () => {
    vi.useFakeTimers();
    parseSpecSpy.mockReturnValue({
      data: {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {},
      },
      error: null,
    });
    validateSpecSpy.mockResolvedValue(["Unknown validation failure"]);

    renderWithIntl(<SpecEditor />);

    const model = {
      getLineCount: () => 10,
      getLineMaxColumn: () => 120,
    };
    const editor = {
      getModel: () => model,
    };
    const monaco = {
      MarkerSeverity: { Error: 8 },
      editor: { setModelMarkers: setModelMarkersSpy },
    };

    monacoPropsSpy.mock.calls[0][0].onMount?.(editor, monaco);

    fireEvent.change(screen.getByTestId("monaco-mock"), {
      target: {
        value:
          '{"openapi":"3.0.0","info":{"title":"Test API","version":"1.0.0"},"paths":{}}',
      },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(setModelMarkersSpy).toHaveBeenLastCalledWith(
      model,
      "openapi-validation",
      expect.arrayContaining([
        expect.objectContaining({
          message: "Unknown validation failure",
          startLineNumber: 1,
          startColumn: 1,
        }),
      ]),
    );

    vi.useRealTimers();
  });

  it("adjusts marker columns when the error is at the end of a line", async () => {
    vi.useFakeTimers();
    parseSpecSpy.mockReturnValue({
      data: {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {},
      },
      error: null,
    });
    validateSpecSpy.mockResolvedValue([
      "Validation failed at line 2, column 5",
    ]);

    renderWithIntl(<SpecEditor />);

    const model = {
      getLineCount: () => 10,
      getLineMaxColumn: () => 5,
    };
    const editor = {
      getModel: () => model,
    };
    const monaco = {
      MarkerSeverity: { Error: 8 },
      editor: { setModelMarkers: setModelMarkersSpy },
    };

    monacoPropsSpy.mock.calls[0][0].onMount?.(editor, monaco);

    fireEvent.change(screen.getByTestId("monaco-mock"), {
      target: {
        value:
          '{"openapi":"3.0.0","info":{"title":"Test API","version":"1.0.0"},"paths":{}}',
      },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(setModelMarkersSpy).toHaveBeenLastCalledWith(
      model,
      "openapi-validation",
      expect.arrayContaining([
        expect.objectContaining({
          startLineNumber: 2,
          startColumn: 4,
          endColumn: 5,
        }),
      ]),
    );

    vi.useRealTimers();
  });
});
