export type MediaBodyFormat = "json" | "xml" | "form";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Strips parameters such as charset from a media type header value. */
export function normalizeMediaType(mediaType: string): string {
  return mediaType.split(";")[0]?.trim().toLowerCase() ?? "";
}

/** Maps a media type to one of the supported body serialization formats. */
export function getMediaBodyFormat(mediaType: string): MediaBodyFormat {
  const normalized = normalizeMediaType(mediaType);

  if (normalized === "application/x-www-form-urlencoded") return "form";
  if (
    normalized === "application/xml" ||
    normalized === "text/xml" ||
    normalized.endsWith("+xml")
  ) {
    return "xml";
  }

  return "json";
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeXmlTagName(name: string): string {
  const sanitized = name.replace(/[^A-Za-z0-9_.-]/g, "_");
  if (/^[0-9]/.test(sanitized)) return `_${sanitized}`;
  return sanitized || "item";
}

function valueToXml(value: unknown, tagName: string, indent = 0): string {
  const pad = "  ".repeat(indent);
  const safeTag = sanitizeXmlTagName(tagName);

  if (value === null || value === undefined) {
    return `${pad}<${safeTag}></${safeTag}>`;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return `${pad}<${safeTag}>${escapeXml(String(value))}</${safeTag}>`;
  }

  if (Array.isArray(value)) {
    return value.map((item) => valueToXml(item, safeTag, indent)).join("\n");
  }

  if (isRecord(value)) {
    const inner = Object.entries(value)
      .map(([key, nested]) => valueToXml(nested, key, indent + 1))
      .join("\n");
    return `${pad}<${safeTag}>\n${inner}\n${pad}</${safeTag}>`;
  }

  return `${pad}<${safeTag}>${escapeXml(String(value))}</${safeTag}>`;
}

export function formatAsJson(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function formatAsXml(value: unknown, rootTag = "root"): string {
  if (typeof value === "string") return value;
  return valueToXml(value, rootTag);
}

export function formatAsFormUrlEncoded(value: unknown): string {
  if (typeof value === "string") return value;
  if (!isRecord(value)) return String(value);

  const params = new URLSearchParams();
  for (const [key, nested] of Object.entries(value)) {
    if (nested === null || nested === undefined) continue;
    if (typeof nested === "object") {
      params.append(key, JSON.stringify(nested));
    } else {
      params.append(key, String(nested));
    }
  }

  return params.toString();
}

/** Serializes a value for display according to the selected media type. */
export function formatMediaBody(value: unknown, mediaType: string): string {
  switch (getMediaBodyFormat(mediaType)) {
    case "xml":
      return formatAsXml(value);
    case "form":
      return formatAsFormUrlEncoded(value);
    default:
      return formatAsJson(value);
  }
}
