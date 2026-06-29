import { describe, it, expect } from "vitest";
import { formatBytes, formatDuration } from "./format";

describe("formatBytes", () => {
  it("returns '0 B' for zero and invalid input", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(-5)).toBe("0 B");
    expect(formatBytes(Number.NaN)).toBe("0 B");
  });

  it("formats bytes, kilobytes and megabytes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
  });

  it("caps very large values at GB", () => {
    expect(formatBytes(1024 ** 4)).toContain("GB");
  });
});

describe("formatDuration", () => {
  it("returns '0 ms' for invalid input", () => {
    expect(formatDuration(-1)).toBe("0 ms");
    expect(formatDuration(Number.NaN)).toBe("0 ms");
  });

  it("formats milliseconds and seconds", () => {
    expect(formatDuration(0)).toBe("0 ms");
    expect(formatDuration(250)).toBe("250 ms");
    expect(formatDuration(1500)).toBe("1.50 s");
  });
});
