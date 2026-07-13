/**
 * Endpoint model for the Viewer.
 *
 * `getEndpoints` turns a parsed OpenAPI/Swagger document (as stored in the shared
 * spec store) into a flat, typed list of operations grouped by path + method.
 * It is a pure function with no side effects.
 */

import type { OpenApiDocument } from "@/store/spec-store";

/** HTTP methods recognised as operations on a Path Item Object. */
export const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

/** Where a parameter lives, per the OpenAPI spec. */
export type ParameterLocation = "path" | "query" | "header" | "cookie";

/** A JSON Schema fragment. We keep it opaque instead of modelling every keyword. */
export type JsonSchema = Record<string, unknown>;

export interface EndpointParameter {
  name: string;
  location: ParameterLocation;
  required: boolean;
  description?: string;
  schema?: JsonSchema;
}

/** Parameters split by their location for easy rendering. */
export interface GroupedParameters {
  path: EndpointParameter[];
  query: EndpointParameter[];
  header: EndpointParameter[];
  cookie: EndpointParameter[];
}

/** A single media type (e.g. `application/json`) with its schema and example. */
export interface MediaTypeContent {
  mediaType: string;
  schema?: JsonSchema;
  example?: unknown;
}

export interface EndpointRequestBody {
  required: boolean;
  description?: string;
  content: MediaTypeContent[];
}

export interface EndpointResponse {
  /** Status code as written in the spec, e.g. "200", "4XX" or "default". */
  statusCode: string;
  description?: string;
  content: MediaTypeContent[];
}

/** A fully described operation, the unit the Viewer renders. */
export interface Endpoint {
  method: HttpMethod;
  path: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags: string[];
  deprecated: boolean;
  parameters: GroupedParameters;
  requestBody: EndpointRequestBody | null;
  responses: EndpointResponse[];
}

const PARAMETER_LOCATIONS: readonly ParameterLocation[] = [
  "path",
  "query",
  "header",
  "cookie",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Decode a single JSON Pointer segment (`~1` -> `/`, `~0` -> `~`). */
function decodePointerSegment(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

/**
 * Resolve a local `$ref` node against the root document, following ref chains.
 * External refs (not starting with `#/`) and cyclic refs resolve to `undefined`.
 * A dereferenced spec (no `$ref`s) passes through untouched.
 */
function resolveRef(
  root: Record<string, unknown>,
  node: unknown,
  seen: Set<string> = new Set(),
): Record<string, unknown> | undefined {
  if (!isRecord(node)) return undefined;

  const ref = node.$ref;
  if (typeof ref !== "string") return node;
  if (!ref.startsWith("#/") || seen.has(ref)) return undefined;
  seen.add(ref);

  const segments = ref.slice(2).split("/").map(decodePointerSegment);
  let current: unknown = root;
  for (const segment of segments) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }

  return resolveRef(root, current, seen);
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isParameterLocation(value: unknown): value is ParameterLocation {
  return (
    typeof value === "string" &&
    PARAMETER_LOCATIONS.includes(value as ParameterLocation)
  );
}

function buildParameter(
  root: Record<string, unknown>,
  raw: unknown,
): EndpointParameter | null {
  const param = resolveRef(root, raw);
  if (!param) return null;

  const name = param.name;
  if (typeof name !== "string" || !isParameterLocation(param.in)) return null;

  const schema = isRecord(param.schema)
    ? resolveRef(root, param.schema)
    : undefined;

  return {
    name,
    location: param.in,
    // Path parameters are always required per the spec.
    required: param.in === "path" ? true : param.required === true,
    description: toOptionalString(param.description),
    schema,
  };
}

/**
 * Merge path-level and operation-level parameters, then split by location.
 * Operation parameters override path parameters with the same name + location.
 */
function groupParameters(
  root: Record<string, unknown>,
  pathParams: unknown[],
  operationParams: unknown[],
): GroupedParameters {
  const merged = new Map<string, EndpointParameter>();

  for (const raw of [...pathParams, ...operationParams]) {
    const parameter = buildParameter(root, raw);
    if (parameter)
      merged.set(`${parameter.location}:${parameter.name}`, parameter);
  }

  const grouped: GroupedParameters = {
    path: [],
    query: [],
    header: [],
    cookie: [],
  };
  for (const parameter of merged.values()) {
    grouped[parameter.location].push(parameter);
  }
  return grouped;
}

/** Pull the first available example from a media type or its schema. */
function extractExample(
  root: Record<string, unknown>,
  media: Record<string, unknown>,
  schema: JsonSchema | undefined,
): unknown {
  if (media.example !== undefined) return media.example;

  if (isRecord(media.examples)) {
    const first = Object.values(media.examples)[0];
    const resolved = resolveRef(root, first);
    if (resolved && "value" in resolved) return resolved.value;
  }

  if (schema && schema.example !== undefined) return schema.example;
  return undefined;
}

function extractContent(
  root: Record<string, unknown>,
  contentObject: unknown,
): MediaTypeContent[] {
  if (!isRecord(contentObject)) return [];

  const result: MediaTypeContent[] = [];
  for (const [mediaType, raw] of Object.entries(contentObject)) {
    const media = resolveRef(root, raw);
    if (!media) continue;

    const schema = isRecord(media.schema)
      ? resolveRef(root, media.schema)
      : undefined;

    result.push({
      mediaType,
      schema,
      example: extractExample(root, media, schema),
    });
  }
  return result;
}

function extractRequestBody(
  root: Record<string, unknown>,
  raw: unknown,
): EndpointRequestBody | null {
  const requestBody = resolveRef(root, raw);
  if (!requestBody) return null;

  return {
    required: requestBody.required === true,
    description: toOptionalString(requestBody.description),
    content: extractContent(root, requestBody.content),
  };
}

function extractResponses(
  root: Record<string, unknown>,
  raw: unknown,
): EndpointResponse[] {
  if (!isRecord(raw)) return [];

  const responses: EndpointResponse[] = [];
  for (const [statusCode, responseRaw] of Object.entries(raw)) {
    const response = resolveRef(root, responseRaw);
    if (!response) continue;

    responses.push({
      statusCode,
      description: toOptionalString(response.description),
      content: extractContent(root, response.content),
    });
  }
  return responses;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

function buildEndpoint(
  root: Record<string, unknown>,
  path: string,
  method: HttpMethod,
  operation: Record<string, unknown>,
  pathParams: unknown[],
): Endpoint {
  const operationParams = Array.isArray(operation.parameters)
    ? operation.parameters
    : [];

  return {
    method,
    path,
    operationId: toOptionalString(operation.operationId),
    summary: toOptionalString(operation.summary),
    description: toOptionalString(operation.description),
    tags: toStringArray(operation.tags),
    deprecated: operation.deprecated === true,
    parameters: groupParameters(root, pathParams, operationParams),
    requestBody: extractRequestBody(root, operation.requestBody),
    responses: extractResponses(root, operation.responses),
  };
}

/**
 * Convert a parsed spec into a flat list of operations, one per path + method.
 * Returns an empty array for a missing or malformed document.
 */
export function getEndpoints(spec: OpenApiDocument | null): Endpoint[] {
  if (!isRecord(spec) || !isRecord(spec.paths)) return [];

  const endpoints: Endpoint[] = [];
  for (const [path, pathItemRaw] of Object.entries(spec.paths)) {
    const pathItem = resolveRef(spec, pathItemRaw);
    if (!pathItem) continue;

    const pathParams = Array.isArray(pathItem.parameters)
      ? pathItem.parameters
      : [];

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!isRecord(operation)) continue;
      endpoints.push(buildEndpoint(spec, path, method, operation, pathParams));
    }
  }
  return endpoints;
}
