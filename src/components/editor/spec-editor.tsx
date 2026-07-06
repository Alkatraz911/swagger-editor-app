"use client";

import { EditorErrors } from "@/components/editor/editor-errors";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { Pane } from "@/components/pane";
import { useMonacoTheme } from "@/hooks/use-monaco-theme";
import { detectFormat } from "@/lib/openapi/detect-format";
import { parseSpec, validateSpec } from "@/lib/openapi/parse";
import { SPEC_ERROR_KEYS, translateSpecError } from "@/lib/openapi/spec-errors";
import type { SavedSchema } from "@/lib/schemas/get-saved-schema";
import { useSpecStore } from "@/store/spec-store";
import type * as Monaco from "monaco-editor";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const MARKER_OWNER = "openapi-validation";

function clampMarkerLocation(
  model: Monaco.editor.ITextModel,
  lineNumber: number,
  column: number,
) {
  const safeLine = Math.min(Math.max(lineNumber, 1), model.getLineCount());
  const maxColumn = Math.max(1, model.getLineMaxColumn(safeLine));
  const safeColumn = Math.min(Math.max(column, 1), maxColumn);

  return {
    lineNumber: safeLine,
    column: safeColumn,
    maxColumn,
  };
}

function getLineAndColumnFromOffset(sourceText: string, offset: number) {
  const safeOffset = Math.max(0, Math.min(offset, sourceText.length));
  const before = sourceText.slice(0, safeOffset);
  const lines = before.split(/\r?\n/);
  const lineNumber = lines.length;
  const column = (lines.at(-1)?.length ?? 0) + 1;

  return { lineNumber, column };
}

function extractMarkerLocation(
  error: string,
  model: Monaco.editor.ITextModel,
  sourceText: string,
) {
  const lineColumnMatch = error.match(/line\s+(\d+)\s*[,;:]\s*column\s+(\d+)/i);
  if (lineColumnMatch) {
    return clampMarkerLocation(
      model,
      Number(lineColumnMatch[1]),
      Number(lineColumnMatch[2]),
    );
  }

  const tupleMatch = error.match(/\((\d+):(\d+)\)/);
  if (tupleMatch) {
    return clampMarkerLocation(
      model,
      Number(tupleMatch[1]),
      Number(tupleMatch[2]),
    );
  }

  const positionMatch = error.match(/position\s+(\d+)/i);
  if (positionMatch) {
    const fromOffset = getLineAndColumnFromOffset(
      sourceText,
      Number(positionMatch[1]),
    );
    return clampMarkerLocation(model, fromOffset.lineNumber, fromOffset.column);
  }

  return clampMarkerLocation(model, 1, 1);
}

function getMarkerColumns(location: { column: number; maxColumn: number }) {
  let startColumn = location.column;
  let endColumn = Math.min(startColumn + 1, location.maxColumn);

  if (endColumn <= startColumn) {
    startColumn = Math.max(1, location.maxColumn - 1);
    endColumn = location.maxColumn;
  }

  return { startColumn, endColumn };
}

function EditorPaneLoader() {
  const tHome = useTranslations("home");

  return (
    <div className="flex h-full items-center justify-center">
      <Pane title={tHome("editorTitle")} hint={tHome("editorHint")} />
    </div>
  );
}

function SpecEditorPane({ userId }: { userId: string | null }) {
  const tSpecErrors = useTranslations("openapi.errors");
  const [editorReady, setEditorReady] = useState(false);
  const theme = useMonacoTheme();
  const validationRunRef = useRef(0);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
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

  const handleMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      setEditorReady(true);
    },
    [],
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
          errors: [parsed.error ?? SPEC_ERROR_KEYS.failedToParse],
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

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) {
      return;
    }

    const model = editor.getModel();
    if (!model) {
      return;
    }

    const markers: Monaco.editor.IMarkerData[] = errors.map((error) => {
      const location = extractMarkerLocation(error, model, rawText);
      const { startColumn, endColumn } = getMarkerColumns(location);

      return {
        severity: monaco.MarkerSeverity.Error,
        message: translateSpecError(error, tSpecErrors),
        startLineNumber: location.lineNumber,
        startColumn,
        endLineNumber: location.lineNumber,
        endColumn,
      };
    });

    monaco.editor.setModelMarkers(model, MARKER_OWNER, markers);
  }, [editorReady, errors, rawText, tSpecErrors]);

  useEffect(() => {
    return () => {
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      const model = editor?.getModel();
      if (model && monaco) {
        monaco.editor.setModelMarkers(model, MARKER_OWNER, []);
      }
    };
  }, []);

  const language = format === "json" ? "json" : "yaml";

  return (
    <>
      <EditorToolbar ready={editorReady} userId={userId} />
      <div
        aria-hidden={editorReady}
        className={`absolute inset-0 z-10 bg-background transition-opacity duration-300 ${
          editorReady ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <EditorPaneLoader />
      </div>
      <div
        className={`spec-editor-monaco min-h-0 flex-1 transition-opacity duration-300 ${
          editorReady ? "opacity-100" : "opacity-0"
        }`}
      >
        <MonacoEditor
          height="100%"
          language={language}
          value={rawText}
          onChange={handleChange}
          loading={null}
          onMount={handleMount}
          options={{
            automaticLayout: true,
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
          }}
          theme={theme}
        />
      </div>
      <EditorErrors errors={errors} />
    </>
  );
}

type SpecEditorProps = {
  userId?: string | null;
  savedSchema?: SavedSchema | null;
};

export function SpecEditor({
  userId = null,
  savedSchema = null,
}: SpecEditorProps) {
  const didHydrate = useRef(false);

  useLayoutEffect(() => {
    if (!savedSchema || didHydrate.current) {
      return;
    }

    didHydrate.current = true;
    useSpecStore.setState({
      rawText: savedSchema.content,
      format: savedSchema.format,
    });
  }, [savedSchema]);

  return (
    <section className="relative flex min-h-0 flex-1 flex-col pl-4">
      <SpecEditorPane userId={userId} />
    </section>
  );
}
