import { describe, expect, it } from "vitest";
import type { Endpoint } from "@/lib/openapi/endpoints";
import { buildProxyRequest, getServerUrlFromSpec } from "./build-proxy-request";

const endpoint: Endpoint = {
  method: "post",
  path: "/users/{id}",
  tags: [],
  deprecated: false,
  parameters: {
    path: [
      {
        name: "id",
        location: "path",
        required: true,
        schema: { type: "string" },
      },
    ],
    query: [
      {
        name: "verbose",
        location: "query",
        required: false,
        schema: { type: "boolean" },
      },
    ],
    header: [
      {
        name: "X-Trace",
        location: "header",
        required: false,
        schema: { type: "string" },
      },
    ],
    cookie: [
      {
        name: "session",
        location: "cookie",
        required: false,
        schema: { type: "string" },
      },
    ],
  },
  requestBody: {
    required: true,
    content: [{ mediaType: "application/json", example: { name: "Ada" } }],
  },
  responses: [],
};

describe("getServerUrlFromSpec", () => {
  it("returns the first server url", () => {
    expect(
      getServerUrlFromSpec({
        servers: [{ url: "https://api.example.com/v1" }],
      }),
    ).toBe("https://api.example.com/v1");
  });

  it("returns an empty string when servers are missing", () => {
    expect(getServerUrlFromSpec({})).toBe("");
    expect(getServerUrlFromSpec(null)).toBe("");
  });
});

describe("buildProxyRequest", () => {
  it("builds a request with path, query, headers, cookies and body", () => {
    const result = buildProxyRequest({
      endpoint,
      serverUrl: "https://api.example.com/",
      paramValues: {
        "path:id": "42",
        "query:verbose": "true",
        "header:X-Trace": "abc",
        "cookie:session": "token",
      },
      body: '{"name":"Ada"}',
      contentType: "application/json",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.request).toEqual({
      method: "POST",
      url: "https://api.example.com/users/42",
      headers: {
        "X-Trace": "abc",
        Cookie: "session=token",
        "Content-Type": "application/json",
      },
      query: { verbose: "true" },
      body: '{"name":"Ada"}',
    });
  });

  it("returns an error when the server url is missing", () => {
    expect(
      buildProxyRequest({
        endpoint,
        serverUrl: "",
        paramValues: {},
      }),
    ).toEqual({ ok: false, errorKey: "noServerUrl" });
  });
});
