"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import type { ProxyRequestBody, ProxyResponseBody } from "@/lib/proxy/types";
import { formatDuration } from "@/lib/format";

export type TryItOutPhase = "idle" | "loading" | "done";

export function useTryItOut() {
  const [phase, setPhase] = useState<TryItOutPhase>("idle");
  const [response, setResponse] = useState<ProxyResponseBody | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPhase("idle");
    setResponse(null);
    setClientError(null);
  }, []);

  const execute = useCallback(async (request: ProxyRequestBody) => {
    setPhase("loading");
    setResponse(null);
    setClientError(null);

    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const data: unknown = await res.json();
      if (!res.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "unknown";
        setClientError(message);
        setPhase("done");
        return;
      }

      setResponse(data as ProxyResponseBody);
      setPhase("done");
    } catch (error) {
      setClientError(
        error instanceof Error ? error.message : "Network request failed",
      );
      setPhase("done");
    }
  }, []);

  return { phase, response, clientError, execute, reset };
}

function responseStatusClass(status: number): string {
  if (status === 0) {
    return "bg-slate-500/15 text-slate-700 dark:text-slate-300";
  }

  switch (Math.floor(status / 100)) {
    case 2:
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case 3:
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    case 4:
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case 5:
      return "bg-rose-500/15 text-rose-700 dark:text-rose-300";
    default:
      return "bg-slate-500/15 text-slate-700 dark:text-slate-300";
  }
}

function formatResponseBody(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

const responseBlockClass =
  "overflow-auto rounded bg-black/5 p-3 font-mono text-xs leading-relaxed dark:bg-white/5";

export function TryItOutResponse({
  loading,
  response,
  clientError,
}: {
  loading: boolean;
  response: ProxyResponseBody | null;
  clientError: string | null;
}) {
  const t = useTranslations("viewer");

  if (loading) {
    return <p className="text-sm opacity-70">{t("loading")}</p>;
  }

  if (clientError) {
    return (
      <p className="text-sm text-rose-600 dark:text-rose-400">
        {t("proxyError", { error: clientError })}
      </p>
    );
  }

  if (!response) return null;

  const headersText = JSON.stringify(response.headers, null, 2);
  const bodyText = formatResponseBody(response.body);

  return (
    <section
      aria-label={t("response")}
      className="flex flex-col gap-3 rounded border border-black/10 bg-white p-3 dark:border-white/10"
    >
      <h3 className="text-sm font-semibold">{t("response")}</h3>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${responseStatusClass(response.status)}`}
        >
          {response.status} {response.statusText}
        </span>
        <span className="text-xs opacity-60">
          {t("duration", { value: formatDuration(response.durationMs) })}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h4 className="text-xs font-medium opacity-70">
          {t("responseHeaders")}
        </h4>
        <pre className={responseBlockClass}>
          <code>{headersText}</code>
        </pre>
      </div>

      <div className="flex flex-col gap-1">
        <h4 className="text-xs font-medium opacity-70">{t("responseBody")}</h4>
        <pre className={responseBlockClass}>
          <code>{bodyText}</code>
        </pre>
      </div>
    </section>
  );
}
