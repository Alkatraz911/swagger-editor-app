import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMonacoTheme } from "./use-monaco-theme";

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useMonacoTheme", () => {
  it("returns 'vs' for light system scheme", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useMonacoTheme());
    expect(result.current).toBe("vs");
  });

  it("returns 'vs-dark' for dark system scheme", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMonacoTheme());
    expect(result.current).toBe("vs-dark");
  });
});
