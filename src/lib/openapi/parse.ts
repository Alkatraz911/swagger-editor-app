import SwaggerParser from "@apidevtools/swagger-parser";
import YAML from "yaml";
import type { SpecFormat } from "./detect-format";
import { createCategoryError, SPEC_ERROR_KEYS } from "./spec-errors";

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
        error: SPEC_ERROR_KEYS.rootMustBeObject,
      };
    }

    return {
      data: parsed,
      error: null,
    };
  } catch (error) {
    if (format === "yaml" && error instanceof Error) {
      const firstLine = error.message.split("\n")[0]?.trim();
      return {
        data: null,
        error: firstLine
          ? createCategoryError({ category: "yaml", detail: firstLine })
          : SPEC_ERROR_KEYS.failedToParse,
      };
    }

    return {
      data: null,
      error:
        error instanceof Error
          ? createCategoryError({
              category: "json",
              detail: error.message,
            })
          : SPEC_ERROR_KEYS.failedToParse,
    };
  }
}

export async function validateSpec(data: unknown): Promise<string[]> {
  if (!isObjectRecord(data)) {
    return [SPEC_ERROR_KEYS.rootMustBeObject];
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
        ? createCategoryError({
            category: "specification",
            detail: error.message,
          })
        : SPEC_ERROR_KEYS.invalidOpenApiDocument,
    ];
  }
}
