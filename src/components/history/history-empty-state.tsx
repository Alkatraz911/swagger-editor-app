import Link from "next/link";

export function HistoryEmptyState({
  message,
  editorLinkLabel,
  viewerLinkLabel,
  editorHref,
  viewerHref,
}: {
  message: string;
  editorLinkLabel: string;
  viewerLinkLabel: string;
  editorHref: string;
  viewerHref: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-black/10 bg-white p-6 text-center dark:border-white/10 dark:bg-black/20">
      <p className="text-sm opacity-80">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <Link href={editorHref} className="font-medium hover:underline">
          {editorLinkLabel}
        </Link>
        <span className="opacity-40">·</span>
        <Link href={viewerHref} className="font-medium hover:underline">
          {viewerLinkLabel}
        </Link>
      </div>
    </div>
  );
}
