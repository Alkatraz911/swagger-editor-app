import { describe, expect, it } from "vitest";
import { convertSpec } from "./convert";

const jsonSpec =
  '{"openapi":"3.0.0","info":{"title":"Pets","version":"1.0.0"},"paths":{}}';

const yamlSpec = `openapi: 3.0.0
info:
  title: Pets
  version: 1.0.0
paths: {}
`;

describe("convertSpec", () => {
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

  it("returns an error for invalid source text", () => {
    const result = convertSpec('{"openapi":"3.0.0"', "json", "yaml");

    expect(result.text).toBeNull();
    expect(result.error).not.toBeNull();
  });
});
