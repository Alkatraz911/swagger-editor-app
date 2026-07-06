"use client";

import { createClient } from "@/lib/supabase/client";
import { useSpecStore } from "@/store/spec-store";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type SaveSchemaButtonProps = {
  userId: string;
};

export function SaveSchemaButton({ userId }: SaveSchemaButtonProps) {
  const t = useTranslations("home");
  const rawText = useSpecStore((state) => state.rawText);
  const format = useSpecStore((state) => state.format);
  const [isSaving, setIsSaving] = useState(false);
  const canSave = rawText.trim().length > 0;

  const handleSave = useCallback(async () => {
    if (!canSave || isSaving) {
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("schemas")
      .upsert(
        { user_id: userId, content: rawText, format },
        { onConflict: "user_id" },
      );

    setIsSaving(false);

    if (error) {
      toast.error(t("editorSaveFailed"));
      return;
    }

    toast.success(t("editorSaveSuccess"));
  }, [canSave, format, isSaving, rawText, t, userId]);

  return (
    <button
      type="button"
      data-testid="save-schema-button"
      className="rounded-md border border-black/20 px-3 py-1 text-xs font-medium transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
      onClick={handleSave}
      disabled={!canSave || isSaving}
      aria-label={t("editorSave")}
    >
      {t("editorSave")}
    </button>
  );
}
