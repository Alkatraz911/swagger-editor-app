"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { RequestRow } from "@/lib/supabase/types";
import { formatDuration } from "@/lib/format";
import {
  formatEndpointLabel,
  formatStatusCode,
  formatTimestamp,
  statusCodeClass,
} from "@/lib/history/format-request";

export function HistoryList({ requests }: { requests: RequestRow[] }) {
  const t = useTranslations("history");
  const locale = useLocale();

  return (
    <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-black/10 bg-black/5 text-xs uppercase tracking-wide dark:border-white/10 dark:bg-white/5">
          <tr>
            <th className="px-4 py-3 font-semibold">
              {t("columns.timestamp")}
            </th>
            <th className="px-4 py-3 font-semibold">{t("columns.method")}</th>
            <th className="px-4 py-3 font-semibold">{t("columns.endpoint")}</th>
            <th className="px-4 py-3 font-semibold">{t("columns.status")}</th>
            <th className="px-4 py-3 font-semibold">{t("columns.duration")}</th>
            <th className="px-4 py-3 font-semibold">{t("columns.details")}</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr
              key={request.id}
              className="border-b border-black/5 last:border-b-0 dark:border-white/5"
            >
              <td className="px-4 py-3 whitespace-nowrap">
                {formatTimestamp(request.created_at, locale)}
              </td>
              <td className="px-4 py-3 font-mono uppercase">
                {request.method}
              </td>
              <td className="max-w-xs truncate px-4 py-3 font-mono text-xs">
                {formatEndpointLabel(request.endpoint_path, request.url)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${statusCodeClass(request.status_code)}`}
                >
                  {formatStatusCode(request.status_code)}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {formatDuration(request.duration_ms)}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/history/${request.id}`}
                  className="font-medium hover:underline"
                >
                  {t("viewDetails")}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
