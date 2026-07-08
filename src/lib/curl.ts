export interface CurlRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
}

export function buildCurl(req: CurlRequest): string {
  const parts = [`curl -X ${req.method} '${req.url}'`];
  for (const [key, value] of Object.entries(req.headers ?? {})) {
    parts.push(`-H '${key}: ${value}'`);
  }
  if (req.body) parts.push(`-d '${req.body}'`);
  return parts.join(" \\\n  ");
}
