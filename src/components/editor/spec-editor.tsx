"use client";

import { Pane } from "@/components/pane";
import { useSpecStore } from "@/store/spec-store";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

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
  const rawText = useSpecStore((state) => state.rawText);
  const format = useSpecStore((state) => state.format);
  const setRawText = useSpecStore((state) => state.setRawText);

  const handleChange = useCallback(
    (nextValue?: string) => {
      setRawText(nextValue ?? "");
    },
    [setRawText],
  );

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
          defaultValue={"// " + t("editorHint")}
          theme="vs-dark"
        />
      </div>
    </>
  );
}

export function SpecEditor() {
  const locale = useLocale();

  return (
    <section className="relative flex min-h-0 flex-1 flex-col pl-4">
      <SpecEditorPane key={locale} />
    </section>
  );
}
