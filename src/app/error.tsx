"use client";

import { useTranslations } from "next-intl";

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="max-w-md opacity-70">{t("description")}</p>
      <button
        onClick={reset}
        className="rounded bg-foreground px-4 py-2 font-medium text-background hover:opacity-90"
      >
        {t("retry")}
      </button>
    </div>
  );
}
