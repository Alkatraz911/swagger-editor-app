import type {
  Endpoint,
  EndpointParameter,
  ParameterLocation,
} from "@/lib/openapi/endpoints";
import type { ProxyRequestBody } from "@/lib/proxy/types";
import type { OpenApiDocument } from "@/store/spec-store";

const PARAM_LOCATIONS: readonly ParameterLocation[] = [
  "path",
  "query",
  "header",
  "cookie",
];

function parameterKey(param: EndpointParameter): string {
  return `${param.location}:${param.name}`;
}

export function getServerUrlFromSpec(spec: OpenApiDocument | null): string {
  if (!spec) return "";

  const servers = spec.servers;
  if (!Array.isArray(servers) || servers.length === 0) return "";

  const first = servers[0];
  if (
    typeof first === "object" &&
    first !== null &&
    typeof (first as { url?: unknown }).url === "string"
  ) {
    return (first as { url: string }).url;
  }

  return "";
}

function substitutePathParams(
  path: string,
  pathParams: Record<string, string>,
): string {
  return path.replace(/\{([^}]+)\}/g, (_, name: string) => {
    const value = pathParams[name];
    return value !== undefined ? encodeURIComponent(value) : `{${name}}`;
  });
}

function joinUrl(base: string, path: string): string {
  const trimmedBase = base.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${normalizedPath}`;
}

export type BuildProxyRequestResult =
  | { ok: true; request: ProxyRequestBody }
  | { ok: false; errorKey: "noServerUrl" };

export function buildProxyRequest(input: {
  endpoint: Endpoint;
  serverUrl: string;
  paramValues: Record<string, string>;
  body?: string;
  contentType?: string;
}): BuildProxyRequestResult {
  const { endpoint, serverUrl, paramValues, body, contentType } = input;

  if (!serverUrl) {
    return { ok: false, errorKey: "noServerUrl" };
  }

  const pathParams: Record<string, string> = {};
  const query: Record<string, string> = {};
  const headers: Record<string, string> = {};
  const cookies: string[] = [];

  for (const location of PARAM_LOCATIONS) {
    for (const param of endpoint.parameters[location]) {
      const value = paramValues[parameterKey(param)];
      if (!value) continue;

      switch (location) {
        case "path":
          pathParams[param.name] = value;
          break;
        case "query":
          query[param.name] = value;
          break;
        case "header":
          headers[param.name] = value;
          break;
        case "cookie":
          cookies.push(`${param.name}=${value}`);
          break;
      }
    }
  }

  if (cookies.length > 0) {
    headers.Cookie = cookies.join("; ");
  }

  const resolvedPath = substitutePathParams(endpoint.path, pathParams);
  const url = joinUrl(serverUrl, resolvedPath);
  const trimmedBody = body?.trim();

  if (trimmedBody && contentType) {
    headers["Content-Type"] = contentType;
  }

  const request: ProxyRequestBody = {
    method: endpoint.method.toUpperCase(),
    url,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    query: Object.keys(query).length > 0 ? query : undefined,
    body: trimmedBody || undefined,
  };

  return { ok: true, request };
}
