import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { authGetUser, requestsInsert } = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  requestsInsert: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: authGetUser },
    from: vi.fn((table: string) => {
      if (table === "requests") {
        return { insert: requestsInsert };
      }
      return { insert: vi.fn() };
    }),
  })),
}));

import { POST } from "./route";

function createProxyRequest(payload: Record<string, unknown>) {
  return new Request("http://localhost/api/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/proxy", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    authGetUser.mockResolvedValue({ data: { user: null } });
    requestsInsert.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns a 500 from the target in the response body instead of throwing", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response("Internal Server Error", {
        status: 500,
        statusText: "Internal Server Error",
        headers: { "Content-Type": "text/plain" },
      }),
    );

    const res = await POST(
      createProxyRequest({
        method: "GET",
        url: "https://api.example.com/fail",
      }),
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe(500);
    expect(data.statusText).toBe("Internal Server Error");
    expect(data.body).toBe("Internal Server Error");
    expect(data.headers["content-type"]).toBe("text/plain");
  });

  it("computes analytics fields and appends query parameters", async () => {
    const responseBody = '{"ok":true}';
    global.fetch = vi.fn().mockResolvedValue(
      new Response(responseBody, {
        status: 200,
        statusText: "OK",
      }),
    );

    const requestPayload = '{"data":"hello"}';
    const res = await POST(
      createProxyRequest({
        method: "POST",
        url: "https://api.example.com/test",
        query: { page: "2" },
        body: requestPayload,
      }),
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/test?page=2",
      expect.objectContaining({
        method: "POST",
        body: requestPayload,
      }),
    );

    const data = await res.json();
    expect(data.durationMs).toBeGreaterThanOrEqual(0);
    expect(data.requestSize).toBe(
      new TextEncoder().encode(requestPayload).length,
    );
    expect(data.responseSize).toBe(
      new TextEncoder().encode(responseBody).length,
    );
    expect(data.status).toBe(200);
  });

  it("records request history when the user is authenticated", async () => {
    authGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    global.fetch = vi.fn().mockResolvedValue(
      new Response("not found", {
        status: 404,
        statusText: "Not Found",
      }),
    );

    await POST(
      createProxyRequest({
        method: "get",
        url: "https://api.example.com/pets/1",
      }),
    );

    expect(requestsInsert).toHaveBeenCalledWith({
      user_id: "user-1",
      method: "GET",
      url: "https://api.example.com/pets/1",
      endpoint_path: "/pets/1",
      status_code: 404,
      duration_ms: expect.any(Number),
      request_size: 0,
      response_size: expect.any(Number),
      error_detail: null,
    });
  });

  it("does not insert history when the user is not authenticated", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(new Response("ok", { status: 200 }));

    await POST(
      createProxyRequest({
        method: "GET",
        url: "https://api.example.com/health",
      }),
    );

    expect(requestsInsert).not.toHaveBeenCalled();
  });

  it("returns a network error payload and records error_detail when fetch fails", async () => {
    authGetUser.mockResolvedValue({ data: { user: { id: "user-2" } } });
    global.fetch = vi.fn().mockRejectedValue(new Error("fetch failed"));

    const res = await POST(
      createProxyRequest({
        method: "GET",
        url: "https://api.example.com/down",
      }),
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe(0);
    expect(data.statusText).toBe("Network Error");
    expect(data.body).toBe("fetch failed");
    expect(data.responseSize).toBe(0);

    expect(requestsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-2",
        status_code: null,
        error_detail: "fetch failed",
      }),
    );
  });

  it("returns 400 for invalid proxy requests", async () => {
    const res = await POST(createProxyRequest({ method: "GET" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid proxy request" });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
