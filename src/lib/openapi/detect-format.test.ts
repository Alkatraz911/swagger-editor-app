import { describe, expect, it } from "vitest";
import { detectFormat } from "./detect-format";

describe("detectFormat", () => {
  it("detects json object input", () => {
    expect(detectFormat('{"openapi":"3.0.0"}')).toBe("json");
  });

  it("detects json array input", () => {
    expect(detectFormat('[{"openapi":"3.0.0"}]')).toBe("json");
  });

  it("detects yaml input", () => {
    expect(detectFormat("openapi: 3.0.0")).toBe("yaml");
  });

  it("handles leading whitespace before json", () => {
    expect(detectFormat('\n  {"openapi":"3.0.0"}')).toBe("json");
  });

  it("treats empty text as yaml", () => {
    expect(detectFormat("")).toBe("yaml");
  });
});
