import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-black/10 px-4 py-4 text-sm dark:border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/about" className="hover:underline">
          {t("about")}
        </Link>
        <span className="opacity-60">{t("copyright")}</span>
      </div>
    </footer>
  );
}
