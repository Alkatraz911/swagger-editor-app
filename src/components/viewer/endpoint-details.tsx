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
import { MethodBadge } from "./method-badge";
import { CodeBlock } from "./code-block";

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
}: {
  content: MediaTypeContent[];
  root?: OpenApiDocument | null;
  editable?: boolean;
}) {
  const t = useTranslations("viewer");

  if (content.length === 0) return null;

  const selected = content[0];
  const selectedType = selected.mediaType;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium opacity-70">{t("mediaType")}</p>
        <p className="text-xs font-medium opacity-100">Application/json</p>
      </div>

      {selected.schema ? (
        <div key={`${selectedType}-schema`}>
          <p className="mb-1 text-xs font-medium opacity-70">{t("schema")}</p>
          <CodeBlock
            contentKey={`${selectedType}-schema`}
            value={selected.schema}
            root={root ?? undefined}
            editable={editable}
          />
        </div>
      ) : null}
      {selected.example !== undefined ? (
        <div key={`${selectedType}-example`}>
          <p className="mb-1 text-xs font-medium opacity-70">{t("example")}</p>
          <CodeBlock
            contentKey={`${selectedType}-example`}
            value={selected.example}
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

/** Full description of a single operation: params, request body and responses. */
export function EndpointDetails({ endpoint }: { endpoint: Endpoint }) {
  const t = useTranslations("viewer");
  const parsedSpec = useSpecStore((state) => state.parsedSpec);
  const [tryItOut, setTryItOut] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

  const parameterGroups = PARAM_ORDER.map((location) => ({
    location,
    params: endpoint.parameters[location],
  })).filter((group) => group.params.length > 0);

  const actionButtonClass =
    "bg-white text-black text-sm font-medium px-2 py-1 rounded-md cursor-pointer border border-black/100 dark:border-white/10 min-w-20 hover:bg-white/50 transition-colors duration-200 ease-in-out dark:hover:bg-white/50";

  function handleTryItOutToggle() {
    if (tryItOut) {
      setParamValues({});
    }
    setTryItOut((active) => !active);
  }

  function handleParamValueChange(key: string, value: string) {
    setParamValues((current) => ({ ...current, [key]: value }));
  }

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
        <button type="button" className={actionButtonClass}>
          {t("execute")}
        </button>
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
