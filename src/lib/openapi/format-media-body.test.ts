import { describe, expect, it } from "vitest";
import {
  formatAsFormUrlEncoded,
  formatAsJson,
  formatAsXml,
  formatMediaBody,
  getMediaBodyFormat,
  normalizeMediaType,
} from "./format-media-body";

describe("normalizeMediaType", () => {
  it("strips charset and normalizes casing", () => {
    expect(normalizeMediaType("Application/JSON; charset=utf-8")).toBe(
      "application/json",
    );
  });
});

describe("getMediaBodyFormat", () => {
  it("detects json, xml and form types", () => {
    expect(getMediaBodyFormat("application/json")).toBe("json");
    expect(getMediaBodyFormat("application/vnd.api+json")).toBe("json");
    expect(getMediaBodyFormat("application/xml")).toBe("xml");
    expect(getMediaBodyFormat("text/xml")).toBe("xml");
    expect(getMediaBodyFormat("application/atom+xml")).toBe("xml");
    expect(getMediaBodyFormat("application/x-www-form-urlencoded")).toBe(
      "form",
    );
  });
});

describe("formatAsJson", () => {
  it("pretty-prints objects", () => {
    expect(formatAsJson({ a: 1 })).toBe('{\n  "a": 1\n}');
  });

  it("passes strings through unchanged", () => {
    expect(formatAsJson('{"a":1}')).toBe('{"a":1}');
  });
});

describe("formatAsXml", () => {
  it("serializes nested objects and arrays", () => {
    expect(formatAsXml({ name: "Ada", tags: ["a", "b"] })).toBe(
      `<root>\n  <name>Ada</name>\n  <tags>a</tags>\n  <tags>b</tags>\n</root>`,
    );
  });

  it("passes string values through unchanged", () => {
    expect(formatAsXml("<note/>")).toBe("<note/>");
  });
});

describe("formatAsFormUrlEncoded", () => {
  it("encodes flat objects", () => {
    expect(formatAsFormUrlEncoded({ name: "Ada", active: true })).toBe(
      "name=Ada&active=true",
    );
  });

  it("stringifies nested values", () => {
    expect(formatAsFormUrlEncoded({ user: { id: 1 } })).toBe(
      "user=%7B%22id%22%3A1%7D",
    );
  });
});

describe("formatMediaBody", () => {
  it("formats according to the media type", () => {
    const value = { name: "Ada" };

    expect(formatMediaBody(value, "application/json")).toContain(
      '"name": "Ada"',
    );
    expect(formatMediaBody(value, "application/xml")).toContain(
      "<name>Ada</name>",
    );
    expect(formatMediaBody(value, "application/x-www-form-urlencoded")).toBe(
      "name=Ada",
    );
  });
});
