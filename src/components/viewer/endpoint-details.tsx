"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSpecStore } from "@/store/spec-store";
import type { OpenApiDocument } from "@/store/spec-store";
import type {
  Endpoint,
  EndpointParameter,
  JsonSchema,
  MediaTypeContent,
  ParameterLocation,
} from "@/lib/openapi/endpoints";
import { formatMediaBody } from "@/lib/openapi/format-media-body";
import { buildProxyRequest } from "@/lib/viewer/build-proxy-request";
import { buildCurlFromProxyRequest } from "@/lib/viewer/build-curl-command";
import { MethodBadge } from "./method-badge";
import { CodeBlock, transformValue } from "./code-block";
import { TryItOutResponse, useTryItOut } from "./try-it-out";

const PARAM_LABEL_KEY: Record<ParameterLocation, string> = {
  path: "pathParams",
  query: "queryParams",
  header: "headerParams",
  cookie: "cookieParams",
};

const PARAM_ORDER: readonly ParameterLocation[] = [
  "path",
  "query",
  "header",
  "cookie",
];

function parameterKey(param: EndpointParameter): string {
  return `${param.location}:${param.name}`;
}

const paramInputClass =
  "mt-2 w-full rounded border border-black/10 bg-white px-2 py-1 font-mono text-sm dark:border-white/10 dark:bg-black/20";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Human-readable type label derived from a JSON Schema fragment. */
function schemaTypeLabel(schema: JsonSchema | undefined): string {
  if (!schema) return "—";

  const { type, items } = schema;
  if (type === "array") {
    const itemType = isRecord(items) ? items.type : undefined;
    return typeof itemType === "string" ? `${itemType}[]` : "array";
  }
  if (typeof type === "string") return type;
  if (Array.isArray(type)) {
    const named = type.filter((t): t is string => typeof t === "string");
    return named.length > 0 ? named.join(" | ") : "—";
  }
  return isRecord(schema.properties) ? "object" : "—";
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function ParameterTable({
  title,
  parameters,
  editable = false,
  values,
  onValueChange,
}: {
  title: string;
  parameters: EndpointParameter[];
  editable?: boolean;
  values?: Record<string, string>;
  onValueChange?: (key: string, value: string) => void;
}) {
  const t = useTranslations("viewer");

  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-xs font-medium opacity-70">{title}</h4>
      <ul className="flex flex-col gap-1">
        {parameters.map((param) => {
          const key = parameterKey(param);

          return (
            <li
              key={key}
              className="rounded border border-black/10 bg-white p-2 text-sm dark:border-white/10"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-mono font-medium">{param.name}</span>
                <span className="text-xs opacity-60">
                  {schemaTypeLabel(param.schema)}
                </span>
                <span
                  className={`text-xs ${param.required ? "text-rose-600 dark:text-rose-400" : "opacity-50"}`}
                >
                  {param.required ? t("required") : t("optional")}
                </span>
              </div>
              {param.description ? (
                <p className="mt-1 text-xs opacity-70">{param.description}</p>
              ) : null}
              {editable ? (
                <input
                  type="text"
                  aria-label={param.name}
                  value={values?.[key] ?? ""}
                  onChange={(event) => onValueChange?.(key, event.target.value)}
                  className={paramInputClass}
                  placeholder={param.name}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MediaContent({
  content,
  root,
  editable = false,
  bodyEditable = false,
  selectedMediaType: controlledMediaType,
  onMediaTypeChange,
  editableBodyText,
  onEditableBodyTextChange,
}: {
  content: MediaTypeContent[];
  root?: OpenApiDocument | null;
  editable?: boolean;
  bodyEditable?: boolean;
  selectedMediaType?: string;
  onMediaTypeChange?: (mediaType: string) => void;
  editableBodyText?: string;
  onEditableBodyTextChange?: (text: string) => void;
}) {
  const t = useTranslations("viewer");
  const [internalMediaType, setInternalMediaType] = useState(
    () => content[0]?.mediaType ?? "",
  );
  const selectedMediaType = controlledMediaType ?? internalMediaType;

  if (content.length === 0) return null;

  const selected =
    content.find((media) => media.mediaType === selectedMediaType) ??
    content[0];
  const selectedType = selected.mediaType;
  const schemaEditable = editable && !bodyEditable;
  const bodySource =
    selected.example !== undefined ? selected.example : selected.schema;
  const canEditBody = editable && bodySource !== undefined;

  function handleMediaTypeChange(nextType: string) {
    if (onMediaTypeChange) {
      onMediaTypeChange(nextType);
    } else {
      setInternalMediaType(nextType);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium opacity-70">{t("mediaType")}</p>
        {content.length > 1 ? (
          <select
            aria-label={t("mediaType")}
            value={selectedType}
            onChange={(event) => handleMediaTypeChange(event.target.value)}
            className="w-full rounded border border-black/10 bg-white px-2 py-1 font-mono text-xs dark:border-white/10 dark:bg-black/20"
          >
            {content.map((media) => (
              <option key={media.mediaType} value={media.mediaType}>
                {media.mediaType}
              </option>
            ))}
          </select>
        ) : (
          <p className="font-mono text-xs font-medium opacity-100">
            {selectedType}
          </p>
        )}
      </div>

      {selected.schema ? (
        <div key={`${selectedType}-schema`}>
          <p className="mb-1 text-xs font-medium opacity-70">{t("schema")}</p>
          <CodeBlock
            contentKey={`${selectedType}-schema`}
            value={selected.schema}
            root={root ?? undefined}
            mediaType={selectedType}
            editable={schemaEditable}
          />
        </div>
      ) : null}
      {selected.example !== undefined ? (
        <div key={`${selectedType}-example`}>
          <p className="mb-1 text-xs font-medium opacity-70">{t("example")}</p>
          <CodeBlock
            contentKey={`${selectedType}-example`}
            value={selected.example}
            root={root ?? undefined}
            mediaType={selectedType}
            editable={canEditBody}
            editableValue={bodyEditable ? editableBodyText : undefined}
            onEditableValueChange={
              bodyEditable ? onEditableBodyTextChange : undefined
            }
          />
        </div>
      ) : bodyEditable && selected.schema ? (
        <div key={`${selectedType}-body`}>
          <p className="mb-1 text-xs font-medium opacity-70">{t("example")}</p>
          <CodeBlock
            contentKey={`${selectedType}-body`}
            value={selected.schema}
            root={root ?? undefined}
            mediaType={selectedType}
            editable={canEditBody}
            editableValue={editableBodyText}
            onEditableValueChange={onEditableBodyTextChange}
          />
        </div>
      ) : null}
    </div>
  );
}

function statusClass(statusCode: string): string {
  switch (statusCode.charAt(0)) {
    case "2":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "3":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    case "4":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "5":
      return "bg-rose-500/15 text-rose-700 dark:text-rose-300";
    default:
      return "bg-slate-500/15 text-slate-700 dark:text-slate-300";
  }
}

function getRequestBodyText(
  endpoint: Endpoint,
  parsedSpec: OpenApiDocument | null,
  mediaType: string,
): string {
  const content = endpoint.requestBody?.content ?? [];
  const selected =
    content.find((media) => media.mediaType === mediaType) ?? content[0];
  if (!selected) return "";

  const source =
    selected.example !== undefined ? selected.example : selected.schema;
  if (source === undefined) return "";

  return formatMediaBody(
    transformValue(source, parsedSpec ?? undefined),
    selected.mediaType,
  );
}

/** Full description of a single operation: params, request body and responses. */
export function EndpointDetails({
  endpoint,
  serverUrl,
}: {
  endpoint: Endpoint;
  serverUrl: string;
}) {
  const t = useTranslations("viewer");
  const parsedSpec = useSpecStore((state) => state.parsedSpec);
  const [tryItOut, setTryItOut] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [requestMediaType, setRequestMediaType] = useState(
    () => endpoint.requestBody?.content[0]?.mediaType ?? "application/json",
  );
  const [requestBodyText, setRequestBodyText] = useState("");
  const [buildErrorKey, setBuildErrorKey] = useState<string | null>(null);
  const [curlCommand, setCurlCommand] = useState<string | null>(null);
  const [curlCopied, setCurlCopied] = useState(false);
  const { phase, response, clientError, execute, reset } = useTryItOut();

  const parameterGroups = PARAM_ORDER.map((location) => ({
    location,
    params: endpoint.parameters[location],
  })).filter((group) => group.params.length > 0);

  const actionButtonClass =
    "bg-white text-black text-sm font-medium px-2 py-1 rounded-md cursor-pointer border border-black/100 dark:border-white/10 min-w-20 hover:bg-white/50 transition-colors duration-200 ease-in-out dark:hover:bg-white/50";

  function buildCurrentProxyRequest() {
    return buildProxyRequest({
      endpoint,
      serverUrl,
      paramValues,
      body: endpoint.requestBody ? requestBodyText : undefined,
      contentType: endpoint.requestBody ? requestMediaType : undefined,
    });
  }

  function handleTryItOutToggle() {
    if (tryItOut) {
      setParamValues({});
      setBuildErrorKey(null);
      setCurlCommand(null);
      setCurlCopied(false);
      reset();
    } else {
      const mediaType =
        endpoint.requestBody?.content[0]?.mediaType ?? "application/json";
      setRequestMediaType(mediaType);
      setRequestBodyText(getRequestBodyText(endpoint, parsedSpec, mediaType));
    }
    setTryItOut((active) => !active);
  }

  function handleRequestMediaTypeChange(mediaType: string) {
    setRequestMediaType(mediaType);
    if (tryItOut) {
      setRequestBodyText(getRequestBodyText(endpoint, parsedSpec, mediaType));
    }
  }

  function handleParamValueChange(key: string, value: string) {
    setParamValues((current) => ({ ...current, [key]: value }));
  }

  async function handleExecute() {
    setBuildErrorKey(null);

    const built = buildCurrentProxyRequest();

    if (!built.ok) {
      setBuildErrorKey(built.errorKey);
      return;
    }

    await execute(built.request);
  }

  function handleGenerateCurl() {
    setBuildErrorKey(null);

    const built = buildCurrentProxyRequest();
    if (!built.ok) {
      setBuildErrorKey(built.errorKey);
      setCurlCommand(null);
      return;
    }

    setCurlCommand(buildCurlFromProxyRequest(built.request));
  }

  async function handleCopyCurl() {
    if (!curlCommand) return;

    await navigator.clipboard.writeText(curlCommand);
    setCurlCopied(true);
    window.setTimeout(() => setCurlCopied(false), 1000);
  }

  const displayError =
    buildErrorKey === "noServerUrl"
      ? t("noServerUrl")
      : clientError
        ? t("proxyError", { error: clientError })
        : null;

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <MethodBadge method={endpoint.method} />
          <span className="font-mono text-sm break-all">{endpoint.path}</span>
          {endpoint.deprecated ? (
            <span className="rounded bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-300">
              {t("deprecated")}
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleTryItOutToggle}
            className={`${actionButtonClass} ml-auto`}
          >
            {tryItOut ? t("cancel") : t("tryItOut")}
          </button>
        </div>
        {endpoint.summary ? (
          <p className="text-sm font-medium">{endpoint.summary}</p>
        ) : null}
        {endpoint.description ? (
          <p className="text-sm opacity-70">{endpoint.description}</p>
        ) : null}
      </header>
      {tryItOut ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExecute}
              disabled={phase === "loading"}
              className={`${actionButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {phase === "loading" ? t("loading") : t("execute")}
            </button>
            <button
              type="button"
              onClick={handleGenerateCurl}
              className={actionButtonClass}
            >
              {t("generateCurl")}
            </button>
          </div>
          {curlCommand ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{t("curlCommand")}</h3>
                <button
                  type="button"
                  onClick={handleCopyCurl}
                  className={actionButtonClass}
                >
                  {curlCopied ? t("copied") : t("copy")}
                </button>
              </div>
              <pre className="overflow-auto rounded bg-black/5 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all dark:bg-white/5">
                <code>{curlCommand}</code>
              </pre>
            </div>
          ) : null}
          {displayError ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">
              {displayError}
            </p>
          ) : (
            <TryItOutResponse
              loading={phase === "loading"}
              response={response}
              clientError={null}
            />
          )}
        </div>
      ) : null}
      <Section title={t("parameters")}>
        {parameterGroups.length > 0 ? (
          parameterGroups.map((group) => (
            <ParameterTable
              key={group.location}
              title={t(PARAM_LABEL_KEY[group.location])}
              parameters={group.params}
              editable={tryItOut}
              values={paramValues}
              onValueChange={handleParamValueChange}
            />
          ))
        ) : (
          <p className="text-sm opacity-60">{t("noParameters")}</p>
        )}
      </Section>

      {endpoint.requestBody ? (
        <Section title={t("requestBody")}>
          {endpoint.requestBody.content.length > 0 ? (
            <MediaContent
              key="request-body"
              content={endpoint.requestBody.content}
              root={parsedSpec}
              editable={tryItOut}
              bodyEditable={tryItOut}
              selectedMediaType={requestMediaType}
              onMediaTypeChange={handleRequestMediaTypeChange}
              editableBodyText={requestBodyText}
              onEditableBodyTextChange={setRequestBodyText}
            />
          ) : (
            <p className="text-sm opacity-60">{t("noExample")}</p>
          )}
        </Section>
      ) : null}

      <Section title={t("responses")}>
        <div className="flex flex-col gap-4">
          {endpoint.responses.map((response) => (
            <div key={response.statusCode} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${statusClass(response.statusCode)}`}
                >
                  {response.statusCode}
                </span>
                {response.description ? (
                  <span className="text-sm opacity-70">
                    {response.description}
                  </span>
                ) : null}
              </div>
              {response.content.length > 0 ? (
                <MediaContent
                  key={`response-${response.statusCode}`}
                  content={response.content}
                  root={parsedSpec}
                />
              ) : null}
            </div>
          ))}
        </div>
      </Section>
    </article>
  );
}
