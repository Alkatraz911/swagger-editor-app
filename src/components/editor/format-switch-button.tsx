"use client";

import { convertSpec } from "@/lib/openapi/convert";
import { parseSpec } from "@/lib/openapi/parse";
import { useSpecStore } from "@/store/spec-store";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

export function FormatSwitchButton() {
  const t = useTranslations("home");
  const rawText = useSpecStore((state) => state.rawText);
  const format = useSpecStore((state) => state.format);
  const setRawText = useSpecStore((state) => state.setRawText);
  const setFormat = useSpecStore((state) => state.setFormat);
  const setParsedResult = useSpecStore((state) => state.setParsedResult);
  const switchTargetFormat = format === "json" ? "yaml" : "json";
  const formatSwitchState = useMemo(() => {
    const parsed = parseSpec(rawText, format);
    return {
      canSwitch: !parsed.error && !!parsed.data,
    };
  }, [format, rawText]);

  const handleFormatSwitch = useCallback(() => {
    if (!rawText.trim()) {
      setFormat(switchTargetFormat);
      setParsedResult({ parsedSpec: null, errors: [] });
      return;
    }

    const conversion = convertSpec(rawText, format, switchTargetFormat);
    if (conversion.error || !conversion.text) {
      setParsedResult({
        parsedSpec: null,
        errors: [
          t("editorSwitchFailed", {
            error: conversion.error ?? "Unknown conversion error.",
          }),
        ],
      });
      return;
    }

    setRawText(conversion.text);
    setFormat(switchTargetFormat);
    setParsedResult({ parsedSpec: null, errors: [] });
  }, [
    format,
    rawText,
    setFormat,
    setParsedResult,
    setRawText,
    switchTargetFormat,
    t,
  ]);

  return (
    <>
      <span className="text-xs font-medium tracking-wide opacity-70">
        {format.toUpperCase()}
      </span>
      <button
        type="button"
        data-testid="format-switch-button"
        className="rounded-md border border-black/20 px-3 py-1 text-xs font-medium transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
        onClick={handleFormatSwitch}
        disabled={!formatSwitchState.canSwitch}
        title={
          formatSwitchState.canSwitch
            ? undefined
            : t("editorSwitchDisabledHint")
        }
        aria-label={t("editorSwitchToFormat", {
          format: switchTargetFormat.toUpperCase(),
        })}
      >
        {t("editorSwitchToFormat", {
          format: switchTargetFormat.toUpperCase(),
        })}
      </button>
    </>
  );
}
