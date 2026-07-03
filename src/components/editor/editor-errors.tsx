"use client";

import { translateSpecError } from "@/lib/openapi/spec-errors";
import { useTranslations } from "next-intl";

type EditorErrorsProps = {
  errors: string[];
};

export function EditorErrors({ errors }: EditorErrorsProps) {
  const t = useTranslations("home");
  const tSpecErrors = useTranslations("openapi.errors");

  if (errors.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className="absolute bottom-5 right-7 left-15 z-20 font-mono
        rounded-md border border-destructive/40 text-red-700 dark:text-red-300
        bg-destructive/10 p-3 text-sm shadow-lg bg-red-500/15"
    >
      <p className="mb-1 font-medium">{t("editorErrorsTitle")}</p>
      <ul className="list-disc pl-5">
        {errors.map((error, index) => (
          <li key={`${index}-${error}`}>
            {translateSpecError(error, tSpecErrors)}
          </li>
        ))}
      </ul>
    </div>
  );
}
