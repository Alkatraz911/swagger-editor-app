export const locales = ["en", "ru"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Cookie that stores the user's chosen locale (read by i18n/request.ts). */
export const LOCALE_COOKIE = "NEXT_LOCALE";
