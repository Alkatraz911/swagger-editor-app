"use client";

import { Pane } from "@/components/pane";
import { useMonacoTheme } from "@/hooks/use-monaco-theme";
import { detectFormat } from "@/lib/openapi/detect-format";
import { parseSpec, validateSpec } from "@/lib/openapi/parse";
import { useSpecStore } from "@/store/spec-store";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

function EditorPaneLoader() {
  const tHome = useTranslations("home");

  return (
    <div className="flex h-full items-center justify-center">
      <Pane title={tHome("editorTitle")} hint={tHome("editorHint")} />
    </div>
  );
}

function SpecEditorPane() {
  const t = useTranslations("home");
  const [editorReady, setEditorReady] = useState(false);
  const theme = useMonacoTheme();
  const validationRunRef = useRef(0);
  const rawText = useSpecStore((state) => state.rawText);
  const format = useSpecStore((state) => state.format);
  const errors = useSpecStore((state) => state.errors);
  const setRawText = useSpecStore((state) => state.setRawText);
  const setFormat = useSpecStore((state) => state.setFormat);
  const setParsedResult = useSpecStore((state) => state.setParsedResult);

  const handleChange = useCallback(
    (nextValue?: string) => {
      const nextText = nextValue ?? "";
      setRawText(nextText);
      setFormat(detectFormat(nextText));
    },
    [setRawText, setFormat],
  );

  useEffect(() => {
    const runId = validationRunRef.current + 1;
    validationRunRef.current = runId;

    const detectedFormat = detectFormat(rawText);
    if (detectedFormat !== format) {
      setFormat(detectedFormat);
    }

    const timeoutId = window.setTimeout(async () => {
      if (!rawText.trim()) {
        if (validationRunRef.current !== runId) {
          return;
        }
        setParsedResult({ parsedSpec: null, errors: [] });
        return;
      }

      const parsed = parseSpec(rawText, detectedFormat);
      if (parsed.error || !parsed.data) {
        if (validationRunRef.current !== runId) {
          return;
        }
        setParsedResult({
          parsedSpec: null,
          errors: [parsed.error ?? "Failed to parse specification."],
        });
        return;
      }

      const validationErrors = await validateSpec(parsed.data);
      if (validationRunRef.current !== runId) {
        return;
      }

      if (validationErrors.length > 0) {
        setParsedResult({ parsedSpec: null, errors: validationErrors });
        return;
      }

      setParsedResult({ parsedSpec: parsed.data, errors: [] });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [format, rawText, setFormat, setParsedResult]);

  const language = format === "json" ? "json" : "yaml";

  return (
    <>
      <div
        aria-hidden={editorReady}
        className={`absolute inset-0 z-10 bg-background transition-opacity duration-300 ${
          editorReady ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <EditorPaneLoader />
      </div>
      <div
        className={`min-h-0 flex-1 transition-opacity duration-300 ${
          editorReady ? "opacity-100" : "opacity-0"
        }`}
      >
        <MonacoEditor
          height="100%"
          language={language}
          value={rawText}
          onChange={handleChange}
          loading={null}
          onMount={() => setEditorReady(true)}
          options={{
            automaticLayout: true,
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
          }}
          theme={theme}
        />
      </div>
      {errors.length > 0 ? (
        <div
          role="alert"
          className="absolute bottom-5 right-5 left-5 z-20 max-w-md
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
      ) : null}
    </>
  );
}

export function SpecEditor() {
  return (
    <section className="relative flex min-h-0 flex-1 flex-col pl-4">
      <SpecEditorPane />
    </section>
  );
}
