import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useOrientation } from "./use-orientation";

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

describe("useOrientation", () => {
  it("returns 'horizontal' in landscape", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useOrientation());
    expect(result.current).toBe("horizontal");
  });

  it("returns 'vertical' in portrait", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useOrientation());
    expect(result.current).toBe("vertical");
  });
});
