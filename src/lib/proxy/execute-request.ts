import type {
  ProxyExecutionResult,
  ProxyRequestBody,
  ProxyResponseBody,
} from "./types";

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

function byteSize(text: string | undefined): number {
  if (!text) return 0;
  return new TextEncoder().encode(text).byteLength;
}

function headersToRecord(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function buildTargetUrl(
  baseUrl: string,
  query?: Record<string, string>,
): string {
  const url = new URL(baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export function parseProxyRequest(body: unknown): ProxyRequestBody | null {
  if (typeof body !== "object" || body === null) return null;

  const record = body as Record<string, unknown>;
  if (typeof record.method !== "string" || record.method.length === 0) {
    return null;
  }
  if (typeof record.url !== "string" || record.url.length === 0) {
    return null;
  }

  try {
    new URL(record.url);
  } catch {
    return null;
  }

  const headers =
    record.headers !== undefined
      ? parseStringRecord(record.headers)
      : undefined;
  if (headers === null) return null;

  const query =
    record.query !== undefined ? parseStringRecord(record.query) : undefined;
  if (query === null) return null;

  const requestBody =
    record.body !== undefined
      ? typeof record.body === "string"
        ? record.body
        : null
      : undefined;
  if (requestBody === null) return null;

  return {
    method: record.method,
    url: record.url,
    headers,
    query,
    body: requestBody,
  };
}

function parseStringRecord(
  value: unknown,
): Record<string, string> | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "string") {
      return null;
    }
    result[key] = entry;
  }
  return result;
}

function buildFetchInit(input: ProxyRequestBody): RequestInit {
  const method = input.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers: input.headers,
  };

  if (
    input.body !== undefined &&
    input.body !== "" &&
    !METHODS_WITHOUT_BODY.has(method)
  ) {
    init.body = input.body;
  }

  return init;
}

function networkErrorResponse(
  message: string,
  durationMs: number,
  requestSize: number,
): ProxyResponseBody {
  return {
    status: 0,
    statusText: "Network Error",
    headers: {},
    body: message,
    durationMs,
    requestSize,
    responseSize: 0,
  };
}

export async function executeProxyRequest(
  input: ProxyRequestBody,
): Promise<ProxyExecutionResult> {
  const targetUrl = buildTargetUrl(input.url, input.query);
  const requestSize = byteSize(input.body);
  const start = performance.now();

  let endpointPath: string | null = null;
  try {
    endpointPath = new URL(targetUrl).pathname;
  } catch {
    endpointPath = null;
  }

  try {
    const response = await fetch(targetUrl, buildFetchInit(input));
    const responseBody = await response.text();
    const durationMs = Math.round(performance.now() - start);

    return {
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: headersToRecord(response.headers),
        body: responseBody,
        durationMs,
        requestSize,
        responseSize: byteSize(responseBody),
      },
      errorDetail: null,
      targetUrl,
      endpointPath,
    };
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    const message =
      error instanceof Error ? error.message : "Network request failed";

    return {
      response: networkErrorResponse(message, durationMs, requestSize),
      errorDetail: message,
      targetUrl,
      endpointPath,
    };
  }
}
