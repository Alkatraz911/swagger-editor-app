import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useScrolled } from "./use-scrolled";

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { value, configurable: true });
}

describe("useScrolled", () => {
  it("is false at the top of the page", () => {
    setScrollY(0);
    const { result } = renderHook(() => useScrolled(10));
    expect(result.current).toBe(false);
  });

  it("becomes true after scrolling past the threshold", () => {
    setScrollY(0);
    const { result } = renderHook(() => useScrolled(10));

    act(() => {
      setScrollY(50);
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(true);
  });
});
