import { describe, it, expect } from "vitest";
import { getEndpoints } from "./endpoints";
import type { OpenApiDocument } from "@/store/spec-store";

const sampleSpec: OpenApiDocument = {
  openapi: "3.0.0",
  info: { title: "Sample", version: "1.0.0" },
  paths: {
    "/users/{id}": {
      // Path-level parameter shared by all operations.
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      get: {
        operationId: "getUser",
        summary: "Get a user",
        tags: ["users"],
        parameters: [
          { name: "verbose", in: "query", schema: { type: "boolean" } },
          { name: "X-Trace", in: "header", schema: { type: "string" } },
          { name: "session", in: "cookie", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
                example: { id: "1", name: "Ada" },
              },
            },
          },
          "404": { description: "Not found" },
        },
      },
      put: {
        summary: "Replace a user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/User" },
              examples: {
                sample: { value: { id: "1", name: "Grace" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          default: { description: "Unexpected error" },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
        },
      },
    },
  },
};

describe("getEndpoints", () => {
  it("returns an empty array for null or malformed specs", () => {
    expect(getEndpoints(null)).toEqual([]);
    expect(getEndpoints({})).toEqual([]);
    expect(getEndpoints({ paths: null } as unknown as OpenApiDocument)).toEqual(
      [],
    );
  });

  it("groups operations by path and method", () => {
    const endpoints = getEndpoints(sampleSpec);
    expect(endpoints).toHaveLength(2);
    expect(endpoints.map((e) => `${e.method} ${e.path}`)).toEqual([
      "get /users/{id}",
      "put /users/{id}",
    ]);
  });

  it("carries operation metadata", () => {
    const [get] = getEndpoints(sampleSpec);
    expect(get.operationId).toBe("getUser");
    expect(get.summary).toBe("Get a user");
    expect(get.tags).toEqual(["users"]);
    expect(get.deprecated).toBe(false);
  });

  it("splits parameters by every location and merges path-level ones", () => {
    const [get] = getEndpoints(sampleSpec);
    expect(get.parameters.path.map((p) => p.name)).toEqual(["id"]);
    expect(get.parameters.query.map((p) => p.name)).toEqual(["verbose"]);
    expect(get.parameters.header.map((p) => p.name)).toEqual(["X-Trace"]);
    expect(get.parameters.cookie.map((p) => p.name)).toEqual(["session"]);
  });

  it("marks path parameters as required and others by their flag", () => {
    const [get] = getEndpoints(sampleSpec);
    expect(get.parameters.path[0].required).toBe(true);
    expect(get.parameters.query[0].required).toBe(false);
  });

  it("extracts the request body with resolved schema and example", () => {
    const [, put] = getEndpoints(sampleSpec);
    expect(put.requestBody?.required).toBe(true);
    const [media] = put.requestBody?.content ?? [];
    expect(media.mediaType).toBe("application/json");
    expect(media.schema).toEqual({
      type: "object",
      properties: { id: { type: "string" }, name: { type: "string" } },
    });
    expect(media.example).toEqual({ id: "1", name: "Grace" });
  });

  it("has no request body when the operation omits it", () => {
    const [get] = getEndpoints(sampleSpec);
    expect(get.requestBody).toBeNull();
  });

  it("extracts every response status code with schema and example", () => {
    const [get] = getEndpoints(sampleSpec);
    expect(get.responses.map((r) => r.statusCode)).toEqual(["200", "404"]);

    const ok = get.responses.find((r) => r.statusCode === "200");
    expect(ok?.content[0].mediaType).toBe("application/json");
    expect(ok?.content[0].schema).toEqual({
      type: "object",
      properties: { id: { type: "string" }, name: { type: "string" } },
    });
    expect(ok?.content[0].example).toEqual({ id: "1", name: "Ada" });

    const notFound = get.responses.find((r) => r.statusCode === "404");
    expect(notFound?.content).toEqual([]);
  });

  it("keeps the 'default' response code", () => {
    const [, put] = getEndpoints(sampleSpec);
    expect(put.responses.map((r) => r.statusCode)).toContain("default");
  });

  it("resolves a $ref path item", () => {
    const spec: OpenApiDocument = {
      paths: { "/ping": { $ref: "#/components/pathItems/Ping" } },
      components: {
        pathItems: {
          Ping: {
            get: {
              summary: "Ping",
              responses: { "200": { description: "OK" } },
            },
          },
        },
      },
    };
    const endpoints = getEndpoints(spec);
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0].summary).toBe("Ping");
  });

  it("ignores unresolvable and external refs gracefully", () => {
    const spec: OpenApiDocument = {
      paths: {
        "/x": {
          get: {
            parameters: [{ $ref: "external.yaml#/Missing" }],
            responses: { "200": { description: "OK" } },
          },
        },
      },
    };
    const [get] = getEndpoints(spec);
    expect(get.parameters.query).toEqual([]);
    expect(get.parameters.path).toEqual([]);
  });

  it("falls back to the schema example when the media type has none", () => {
    const spec: OpenApiDocument = {
      paths: {
        "/y": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  schema: { type: "string", example: "hi" },
                },
              },
            },
            responses: { "200": { description: "OK" } },
          },
        },
      },
    };
    const [post] = getEndpoints(spec);
    expect(post.requestBody?.content[0].example).toBe("hi");
  });
});
