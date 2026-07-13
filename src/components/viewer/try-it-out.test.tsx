import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/en.json";
import { TryItOutResponse } from "./try-it-out";
import type { ProxyResponseBody } from "@/lib/proxy/types";

function renderResponse(props: {
  loading?: boolean;
  response?: ProxyResponseBody | null;
  clientError?: string | null;
}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <TryItOutResponse
        loading={props.loading ?? false}
        response={props.response ?? null}
        clientError={props.clientError ?? null}
      />
    </NextIntlClientProvider>,
  );
}

describe("TryItOutResponse", () => {
  it("shows a loading message", () => {
    renderResponse({ loading: true });
    expect(screen.getByText("Sending request…")).toBeInTheDocument();
  });

  it("shows a client-side proxy error", () => {
    renderResponse({ clientError: "Invalid proxy request" });
    expect(
      screen.getByText("Could not send the request: Invalid proxy request"),
    ).toBeInTheDocument();
  });

  it("renders status, headers and body for a 404 response", () => {
    const response: ProxyResponseBody = {
      status: 404,
      statusText: "Not Found",
      headers: { "content-type": "application/json" },
      body: '{"message":"missing"}',
      durationMs: 120,
      requestSize: 0,
      responseSize: 19,
    };

    renderResponse({ response });

    expect(screen.getByText("404 Not Found")).toBeInTheDocument();
    expect(
      screen.getByText(/"content-type": "application\/json"/),
    ).toBeInTheDocument();
    expect(screen.getByText(/"message": "missing"/)).toBeInTheDocument();
    expect(screen.getByText(/120 ms/)).toBeInTheDocument();
  });
});

describe("useTryItOut execute", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("stores a 404 target response instead of throwing", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 404,
          statusText: "Not Found",
          headers: {},
          body: "missing",
          durationMs: 50,
          requestSize: 0,
          responseSize: 7,
        }),
        { status: 200 },
      ),
    );

    const { useTryItOut } = await import("./try-it-out");
    let latest: ReturnType<typeof useTryItOut> | undefined;

    function Probe() {
      latest = useTryItOut();
      return null;
    }

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Probe />
      </NextIntlClientProvider>,
    );

    await latest!.execute({
      method: "GET",
      url: "https://api.example.com/missing",
    });

    await waitFor(() => {
      expect(latest!.response?.status).toBe(404);
    });
    expect(latest!.clientError).toBeNull();
  });
});
