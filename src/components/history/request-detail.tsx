"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { RequestRow } from "@/lib/supabase/types";
import { formatBytes, formatDuration } from "@/lib/format";
import {
  formatEndpointLabel,
  formatStatusCode,
  formatTimestamp,
  statusCodeClass,
} from "@/lib/history/format-request";

function AnalyticsField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black/20">
      <dt className="text-xs font-medium opacity-60">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

export function RequestDetail({ request }: { request: RequestRow }) {
  const t = useTranslations("history");
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded bg-black/5 px-2 py-1 font-mono text-sm uppercase dark:bg-white/10">
          {request.method}
        </span>
        <span
          className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${statusCodeClass(request.status_code)}`}
        >
          {formatStatusCode(request.status_code)}
        </span>
        <Link href="/history" className="ml-auto text-sm hover:underline">
          {t("backToHistory")}
        </Link>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <AnalyticsField label={t("analytics.timestamp")}>
          {formatTimestamp(request.created_at, locale)}
        </AnalyticsField>
        <AnalyticsField label={t("analytics.method")}>
          {request.method}
        </AnalyticsField>
        <AnalyticsField label={t("analytics.statusCode")}>
          {formatStatusCode(request.status_code)}
        </AnalyticsField>
        <AnalyticsField label={t("analytics.duration")}>
          {formatDuration(request.duration_ms)}
        </AnalyticsField>
        <AnalyticsField label={t("analytics.requestSize")}>
          {formatBytes(request.request_size)}
        </AnalyticsField>
        <AnalyticsField label={t("analytics.responseSize")}>
          {formatBytes(request.response_size)}
        </AnalyticsField>
        <AnalyticsField label={t("analytics.endpoint")}>
          {formatEndpointLabel(request.endpoint_path, request.url)}
        </AnalyticsField>
        <AnalyticsField label={t("analytics.url")}>
          {request.url}
        </AnalyticsField>
        <div className="sm:col-span-2">
          <AnalyticsField label={t("analytics.errorDetail")}>
            {request.error_detail ?? t("noError")}
          </AnalyticsField>
        </div>
      </dl>
    </div>
  );
}
