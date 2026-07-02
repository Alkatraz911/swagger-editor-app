"use client";

import { useTranslations } from "next-intl";

type EditorErrorsProps = {
  errors: string[];
};

export function EditorErrors({ errors }: EditorErrorsProps) {
  const t = useTranslations("home");

  if (errors.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className="absolute bottom-5 right-5 left-10 z-20 max-w-md
           rounded-md border border-destructive/40
           bg-destructive/10 p-3 text-sm shadow-lg"
    >
      <p className="mb-1 font-medium">{t("editorErrorsTitle")}</p>
      <ul className="list-disc pl-5">
        {errors.map((error, index) => (
          <li key={`${index}-${error}`}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
