"use client";

import type { ChangeEvent } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { locales, LOCALE_COOKIE, type Locale } from "@/i18n/config";

const LABELS: Record<Locale, string> = {
  en: "EN",
  ru: "RU",
};

export function LocaleSwitcher() {
  const router = useRouter();
  const activeLocale = useLocale();

  function onChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000`;
    router.refresh();
  }

  return (
    <select
      aria-label="Language"
      value={activeLocale}
      onChange={onChange}
      className="cursor-pointer rounded border border-black/15 bg-transparent px-2 py-1 text-xs font-medium dark:border-white/20"
    >
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {LABELS[locale]}
        </option>
      ))}
    </select>
  );
}
