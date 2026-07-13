export type SpecFormat = "json" | "yaml";

export function detectFormat(text: string): SpecFormat {
  const trimmed = text.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[") ? "json" : "yaml";
}
