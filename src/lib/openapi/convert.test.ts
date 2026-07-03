import { afterEach, describe, expect, it, vi } from "vitest";
import YAML from "yaml";
import * as parseModule from "./parse";
import { convertSpec } from "./convert";
import { SPEC_ERROR_KEYS } from "./spec-errors";

const jsonSpec =
  '{"openapi":"3.0.0","info":{"title":"Pets","version":"1.0.0"},"paths":{}}';

const yamlSpec = `openapi: 3.0.0
info:
  title: Pets
  version: 1.0.0
paths: {}
`;

describe("convertSpec", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns source text unchanged when source and target formats match", () => {
    const result = convertSpec(jsonSpec, "json", "json");

    expect(result).toEqual({
      text: jsonSpec,
      error: null,
    });
  });

  it("converts yaml input to pretty json", () => {
    const result = convertSpec(yamlSpec, "yaml", "json");

    expect(result.error).toBeNull();
    expect(result.text).toBe(`{
  "openapi": "3.0.0",
  "info": {
    "title": "Pets",
    "version": "1.0.0"
  },
  "paths": {}
}
`);
  });

  it("converts json input to yaml", () => {
    const result = convertSpec(jsonSpec, "json", "yaml");

    expect(result.error).toBeNull();
    expect(result.text).toContain("openapi: 3.0.0");
    expect(result.text).toContain("title: Pets");
    expect(result.text?.endsWith("\n")).toBe(true);
  });

  it("round-trips json->yaml->json with stable object shape", () => {
    const toYaml = convertSpec(jsonSpec, "json", "yaml");
    expect(toYaml.error).toBeNull();
    expect(toYaml.text).not.toBeNull();

    const backToJson = convertSpec(toYaml.text ?? "", "yaml", "json");
    expect(backToJson.error).toBeNull();

    expect(JSON.parse(backToJson.text ?? "{}")).toEqual({
      openapi: "3.0.0",
      info: {
        title: "Pets",
        version: "1.0.0",
      },
      paths: {},
    });
  });

  it("returns a parse error for malformed json without attempting conversion", () => {
    const result = convertSpec('{"openapi":"3.0.0"', "json", "yaml");

    expect(result).toEqual({
      text: null,
      error: expect.stringMatching(/json|unexpected|end/i),
    });
  });

  it("returns a parse error when the document root is not an object", () => {
    const result = convertSpec("[]", "json", "yaml");

    expect(result).toEqual({
      text: null,
      error: SPEC_ERROR_KEYS.rootMustBeObject,
    });
  });

  it("appends a trailing newline when yaml serialization omits one", () => {
    vi.spyOn(YAML, "stringify").mockReturnValueOnce("openapi: 3.0.0");

    const result = convertSpec(jsonSpec, "json", "yaml");

    expect(result.error).toBeNull();
    expect(result.text).toBe("openapi: 3.0.0\n");
  });

  it("returns a fallback parse error when parsing fails without a message", () => {
    vi.spyOn(parseModule, "parseSpec").mockReturnValueOnce({
      data: null,
      error: null,
    });

    const result = convertSpec(jsonSpec, "json", "yaml");

    expect(result).toEqual({
      text: null,
      error: SPEC_ERROR_KEYS.failedToParse,
    });
  });
});
