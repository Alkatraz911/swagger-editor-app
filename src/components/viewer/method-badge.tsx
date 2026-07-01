import type { HttpMethod } from "@/lib/openapi/endpoints";

const METHOD_CLASSES: Record<HttpMethod, string> = {
  get: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  post: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  put: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  patch: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  delete: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  head: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  options: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  trace: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
};

/** A colored pill showing the HTTP method, consistent across list and details. */
export function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-bold tracking-wide uppercase ${METHOD_CLASSES[method]}`}
    >
      {method}
    </span>
  );
}
