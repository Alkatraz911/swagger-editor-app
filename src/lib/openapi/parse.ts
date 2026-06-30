import SwaggerParser from "@apidevtools/swagger-parser";
import YAML from "yaml";
import type { SpecFormat } from "./detect-format";

type ParsedSpecData = Record<string, unknown>;

export interface ParseSpecResult {
  data: ParsedSpecData | null;
  error: string | null;
}

function isObjectRecord(value: unknown): value is ParsedSpecData {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseSpec(text: string, format: SpecFormat): ParseSpecResult {
  try {
    const parsed = format === "json" ? JSON.parse(text) : YAML.parse(text);

    if (!isObjectRecord(parsed)) {
      return {
        data: null,
        error: "Specification root must be an object.",
      };
    }

    return {
      data: parsed,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to parse specification.",
    };
  }
}

export async function validateSpec(data: unknown): Promise<string[]> {
  if (!isObjectRecord(data)) {
    return ["Specification root must be an object."];
  }

  try {
    await SwaggerParser.validate(
      structuredClone(data) as unknown as Parameters<
        typeof SwaggerParser.validate
      >[0],
    );
    return [];
  } catch (error) {
    return [
      error instanceof Error
        ? error.message
        : "Specification is not a valid OpenAPI document.",
    ];
  }
}
