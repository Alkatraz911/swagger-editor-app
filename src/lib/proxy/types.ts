export interface ProxyRequestBody {
  method: string;
  url: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: string;
}

export interface ProxyResponseBody {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
  requestSize: number;
  responseSize: number;
}

export interface ProxyExecutionResult {
  response: ProxyResponseBody;
  errorDetail: string | null;
  targetUrl: string;
  endpointPath: string | null;
}
