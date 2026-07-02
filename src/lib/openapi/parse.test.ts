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

    expect(result).toEqual({
      data: null,
      error: expect.stringMatching(/json|unexpected|end/i),
    });
  });

  it("returns parse error when json root is not an object", () => {
    const result = parseSpec("[]", "json");

    expect(result).toEqual({
      data: null,
      error: "Specification root must be an object.",
    });
  });

  it("returns parse error when yaml root is not an object", () => {
    const result = parseSpec("just a string", "yaml");

    expect(result).toEqual({
      data: null,
      error: "Specification root must be an object.",
    });
  });
});

describe("validateSpec", () => {
  it("returns no errors for valid openapi spec", async () => {
    const errors = await validateSpec(JSON.parse(validOpenApiText));
    expect(errors).toEqual([]);
  });

  it("rejects non-object roots before running OpenAPI validation", async () => {
    await expect(validateSpec([])).resolves.toEqual([
      "Specification root must be an object.",
    ]);
    await expect(validateSpec("not-an-object")).resolves.toEqual([
      "Specification root must be an object.",
    ]);
  });

  it("returns validation errors for invalid openapi spec", async () => {
    const errors = await validateSpec({
      openapi: "3.0.0",
      info: {
        title: "Missing version",
      },
      paths: {},
    });

    expect(errors).toEqual([
      expect.stringMatching(/version|required|schema|valid/i),
    ]);
  });
});
