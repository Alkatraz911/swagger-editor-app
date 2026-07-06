import { afterEach, describe, expect, it, vi } from "vitest";
import SwaggerParser from "@apidevtools/swagger-parser";
import { parseSpec, validateSpec } from "./parse";
import { parseCategoryError, SPEC_ERROR_KEYS } from "./spec-errors";

const validOpenApiText = JSON.stringify({
  openapi: "3.0.0",
  info: {
    title: "Test API",
    version: "1.0.0",
  },
  paths: {},
});

describe("parseSpec", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("returns a categorized parse error for malformed json", () => {
    const result = parseSpec('{"openapi": "3.0.0"', "json");

    expect(parseCategoryError(result.error ?? "")).toMatchObject({
      category: "json",
    });
  });

  it("returns parse error key when json root is not an object", () => {
    const result = parseSpec("[]", "json");

    expect(result).toEqual({
      data: null,
      error: SPEC_ERROR_KEYS.rootMustBeObject,
    });
  });

  it("returns parse error key when yaml root is not an object", () => {
    const result = parseSpec("just a string", "yaml");

    expect(result).toEqual({
      data: null,
      error: SPEC_ERROR_KEYS.rootMustBeObject,
    });
  });

  it("returns a fallback parse error key for non-error throws", () => {
    vi.spyOn(JSON, "parse").mockImplementation(() => {
      throw "broken json";
    });

    const result = parseSpec("{}", "json");

    expect(result).toEqual({
      data: null,
      error: SPEC_ERROR_KEYS.failedToParse,
    });
  });
});

describe("validateSpec", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns no errors for valid openapi spec", async () => {
    const errors = await validateSpec(JSON.parse(validOpenApiText));
    expect(errors).toEqual([]);
  });

  it("rejects non-object roots before running OpenAPI validation", async () => {
    await expect(validateSpec([])).resolves.toEqual([
      SPEC_ERROR_KEYS.rootMustBeObject,
    ]);
    await expect(validateSpec("not-an-object")).resolves.toEqual([
      SPEC_ERROR_KEYS.rootMustBeObject,
    ]);
  });

  it("returns categorized validation errors for invalid openapi spec", async () => {
    const errors = await validateSpec({
      openapi: "3.0.0",
      info: {
        title: "Missing version",
      },
      paths: {},
    });

    expect(parseCategoryError(errors[0] ?? "")).toMatchObject({
      category: "specification",
    });
  });

  it("returns a fallback validation error key for non-error throws", async () => {
    vi.spyOn(SwaggerParser, "validate").mockRejectedValueOnce("invalid spec");

    const errors = await validateSpec(JSON.parse(validOpenApiText));

    expect(errors).toEqual([SPEC_ERROR_KEYS.invalidOpenApiDocument]);
  });
});
