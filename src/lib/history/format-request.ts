/** Tailwind classes for HTTP status code badges in history views. */
export function statusCodeClass(statusCode: number | null): string {
  if (statusCode === null || statusCode === 0) {
    return "bg-slate-500/15 text-slate-700 dark:text-slate-300";
  }

  switch (Math.floor(statusCode / 100)) {
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

export function formatStatusCode(statusCode: number | null): string {
  if (statusCode === null) return "—";
  return String(statusCode);
}

export function formatTimestamp(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatEndpointLabel(
  endpointPath: string | null,
  url: string,
): string {
  return endpointPath ?? url;
}
