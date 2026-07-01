import { useTranslations } from "next-intl";
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
}: {
  title: string;
  parameters: EndpointParameter[];
}) {
  const t = useTranslations("viewer");

  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-xs font-medium opacity-70">{title}</h4>
      <ul className="flex flex-col gap-1">
        {parameters.map((param) => (
          <li
            key={param.name}
            className="rounded border border-black/10 p-2 text-sm dark:border-white/10"
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
          </li>
        ))}
      </ul>
    </div>
  );
}

function MediaContent({ content }: { content: MediaTypeContent[] }) {
  const t = useTranslations("viewer");

  return (
    <div className="flex flex-col gap-3">
      {content.map((media) => (
        <div key={media.mediaType} className="flex flex-col gap-2">
          <span className="font-mono text-xs opacity-60">
            {media.mediaType}
          </span>
          {media.schema ? (
            <div>
              <p className="mb-1 text-xs font-medium opacity-70">
                {t("schema")}
              </p>
              <CodeBlock value={media.schema} />
            </div>
          ) : null}
          {media.example !== undefined ? (
            <div>
              <p className="mb-1 text-xs font-medium opacity-70">
                {t("example")}
              </p>
              <CodeBlock value={media.example} />
            </div>
          ) : null}
        </div>
      ))}
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

  const parameterGroups = PARAM_ORDER.map((location) => ({
    location,
    params: endpoint.parameters[location],
  })).filter((group) => group.params.length > 0);

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
        </div>
        {endpoint.summary ? (
          <p className="text-sm font-medium">{endpoint.summary}</p>
        ) : null}
        {endpoint.description ? (
          <p className="text-sm opacity-70">{endpoint.description}</p>
        ) : null}
      </header>

      <Section title={t("parameters")}>
        {parameterGroups.length > 0 ? (
          parameterGroups.map((group) => (
            <ParameterTable
              key={group.location}
              title={t(PARAM_LABEL_KEY[group.location])}
              parameters={group.params}
            />
          ))
        ) : (
          <p className="text-sm opacity-60">{t("noParameters")}</p>
        )}
      </Section>

      {endpoint.requestBody ? (
        <Section title={t("requestBody")}>
          {endpoint.requestBody.content.length > 0 ? (
            <MediaContent content={endpoint.requestBody.content} />
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
                <MediaContent content={response.content} />
              ) : null}
            </div>
          ))}
        </div>
      </Section>
    </article>
  );
}
