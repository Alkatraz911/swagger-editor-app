import YAML from "yaml";
import type { SpecFormat } from "./detect-format";
import { parseSpec } from "./parse";

export interface ConvertSpecResult {
  text: string | null;
  error: string | null;
}

function formatAsJson(data: Record<string, unknown>): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

function formatAsYaml(data: Record<string, unknown>): string {
  const yamlText = YAML.stringify(data);
  return yamlText.endsWith("\n") ? yamlText : `${yamlText}\n`;
}

export function convertSpec(
  text: string,
  fromFormat: SpecFormat,
  toFormat: SpecFormat,
): ConvertSpecResult {
  if (fromFormat === toFormat) {
    return {
      text,
      error: null,
    };
  }

  const parsed = parseSpec(text, fromFormat);
  if (parsed.error || !parsed.data) {
    return {
      text: null,
      error: parsed.error ?? "Failed to parse specification.",
    };
  }

  return {
    text:
      toFormat === "json"
        ? formatAsJson(parsed.data)
        : formatAsYaml(parsed.data),
    error: null,
  };
}
