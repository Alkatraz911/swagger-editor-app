import { describe, expect, it } from "vitest";
import {
  formatEndpointLabel,
  formatStatusCode,
  statusCodeClass,
} from "./format-request";

describe("formatStatusCode", () => {
  it("returns an em dash for null status codes", () => {
    expect(formatStatusCode(null)).toBe("—");
  });

  it("stringifies numeric status codes", () => {
    expect(formatStatusCode(404)).toBe("404");
  });
});

describe("formatEndpointLabel", () => {
  it("prefers the endpoint path when present", () => {
    expect(
      formatEndpointLabel("/pets/1", "https://api.example.com/pets/1"),
    ).toBe("/pets/1");
  });

  it("falls back to the full url", () => {
    expect(formatEndpointLabel(null, "https://api.example.com/pets/1")).toBe(
      "https://api.example.com/pets/1",
    );
  });
});

describe("statusCodeClass", () => {
  it("maps status families to badge classes", () => {
    expect(statusCodeClass(200)).toContain("emerald");
    expect(statusCodeClass(404)).toContain("amber");
    expect(statusCodeClass(500)).toContain("rose");
    expect(statusCodeClass(null)).toContain("slate");
  });
});
