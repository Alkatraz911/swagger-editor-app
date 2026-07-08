import { buildCurl } from "@/lib/curl";
import { buildTargetUrl } from "@/lib/proxy/execute-request";
import type { ProxyRequestBody } from "@/lib/proxy/types";

export function buildCurlFromProxyRequest(request: ProxyRequestBody): string {
  return buildCurl({
    method: request.method,
    url: buildTargetUrl(request.url, request.query),
    headers: request.headers,
    body: request.body,
  });
}
