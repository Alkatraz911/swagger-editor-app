"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useScrolled } from "@/hooks/use-scrolled";
import { signOut } from "@/lib/auth/actions";

export function Header({ isAuthenticated }: { isAuthenticated: boolean }) {
  const t = useTranslations("nav");
  const scrolled = useScrolled();

  return (
    <header
      className={`sticky top-0 z-50 border-b border-black/10 bg-background/80 backdrop-blur transition-all duration-300 dark:border-white/10 ${
        scrolled ? "h-12 shadow-sm" : "h-16"
      }`}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="font-mono text-sm font-bold whitespace-nowrap"
        >
          {"{ }"} Swagger Editor
        </Link>

        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          <Link href="/about" className="hover:underline">
            {t("about")}
          </Link>

          {isAuthenticated ? (
            <>
              <Link href="/history" className="hover:underline">
                {t("history")}
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded bg-foreground px-3 py-1 text-background hover:opacity-90"
                >
                  {t("signOut")}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="hover:underline">
                {t("signIn")}
              </Link>
              <Link
                href="/sign-up"
                className="rounded bg-foreground px-3 py-1 text-background hover:opacity-90"
              >
                {t("signUp")}
              </Link>
            </>
          )}

          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
