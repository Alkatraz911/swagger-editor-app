import { NextResponse } from "next/server";
import {
  executeProxyRequest,
  parseProxyRequest,
} from "@/lib/proxy/execute-request";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const proxyRequest = parseProxyRequest(body);
  if (!proxyRequest) {
    return NextResponse.json(
      { error: "Invalid proxy request" },
      { status: 400 },
    );
  }

  const { response, errorDetail, targetUrl, endpointPath } =
    await executeProxyRequest(proxyRequest);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("requests").insert({
      user_id: user.id,
      method: proxyRequest.method.toUpperCase(),
      url: targetUrl,
      endpoint_path: endpointPath,
      status_code: response.status > 0 ? response.status : null,
      duration_ms: response.durationMs,
      request_size: response.requestSize,
      response_size: response.responseSize,
      error_detail: errorDetail,
    });
  }

  return NextResponse.json(response);
}
