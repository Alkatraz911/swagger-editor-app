import { describe, expect, it } from "vitest";
import { parseSpec, validateSpec } from "./parse";

const validOpenApiText = JSON.stringify({
  openapi: "3.0.0",
  info: {
    title: "Test API",
    version: "1.0.0",
  },
  paths: {},
});

describe("parseSpec", () => {
  it("parses valid json text", () => {
    const result = parseSpec(validOpenApiText, "json");
    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      openapi: "3.0.0",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      paths: {},
    });
  });

  it("parses valid yaml text", () => {
    const result = parseSpec(
      `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths: {}
`,
      "yaml",
    );

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      openapi: "3.0.0",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      paths: {},
    });
  });

  it("returns parse error for malformed json", () => {
    const result = parseSpec('{"openapi": "3.0.0"', "json");
    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
  });

  it("returns parse error when root is not an object", () => {
    const result = parseSpec("[]", "json");
    expect(result.data).toBeNull();
    expect(result.error).toBe("Specification root must be an object.");
  });
});

describe("validateSpec", () => {
  it("returns no errors for valid openapi spec", async () => {
    const errors = await validateSpec(JSON.parse(validOpenApiText));
    expect(errors).toEqual([]);
  });

  it("returns validation errors for invalid openapi spec", async () => {
    const errors = await validateSpec({
      openapi: "3.0.0",
      info: {
        title: "Missing version",
      },
      paths: {},
    });

    expect(errors.length).toBeGreaterThan(0);
  });
});
