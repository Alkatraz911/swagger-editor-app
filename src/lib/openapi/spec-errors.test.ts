import { describe, expect, it } from "vitest";
import ruMessages from "../../../messages/ru.json";
import enMessages from "../../../messages/en.json";
import {
  createCategoryError,
  SPEC_ERROR_CATEGORIES,
  SPEC_ERROR_KEYS,
  getSpecErrorCategory,
  parseCategoryError,
  translateSpecError,
} from "./spec-errors";

function createTranslator(locale: "en" | "ru") {
  const messages = locale === "ru" ? ruMessages : enMessages;
  const errors = messages.openapi.errors as Record<string, string>;

  return (key: string) => errors[key] ?? key;
}

describe("spec error categories", () => {
  it("exposes three human-readable categories", () => {
    expect(Object.keys(SPEC_ERROR_CATEGORIES)).toEqual([
      "json",
      "yaml",
      "specification",
    ]);
  });

  it("round-trips categorized errors", () => {
    const error = createCategoryError({
      category: "json",
      detail: "Unexpected end of JSON input",
    });

    expect(parseCategoryError(error)).toEqual({
      category: "json",
      detail: "Unexpected end of JSON input",
    });
    expect(getSpecErrorCategory(error)).toBe("json");
  });
});

describe("translateSpecError", () => {
  it("translates known spec error keys", () => {
    const tRu = createTranslator("ru");

    expect(translateSpecError(SPEC_ERROR_KEYS.rootMustBeObject, tRu)).toBe(
      "Корень спецификации должен быть объектом.",
    );
  });

  it("wraps JSON errors with a translated category label", () => {
    const tRu = createTranslator("ru");

    expect(
      translateSpecError(
        createCategoryError({
          category: "json",
          detail:
            "Expected property name or '}' in JSON at position 1 (line 1 column 2)",
        }),
        tRu,
      ),
    ).toBe(
      "Ошибка JSON: Expected property name or '}' in JSON at position 1 (line 1 column 2)",
    );
  });

  it("wraps YAML errors with a translated category label", () => {
    const tRu = createTranslator("ru");

    expect(
      translateSpecError(
        createCategoryError({
          category: "yaml",
          detail: "Flow map must end with a } at line 1, column 5",
        }),
        tRu,
      ),
    ).toBe("Ошибка YAML: Flow map must end with a } at line 1, column 5");
  });

  it("wraps specification errors with a translated category label", () => {
    const tRu = createTranslator("ru");

    expect(
      translateSpecError(
        createCategoryError({
          category: "specification",
          detail: "must have required property 'version'",
        }),
        tRu,
      ),
    ).toBe("Ошибка спецификации: must have required property 'version'");
  });

  it("returns the original message when no category prefix is present", () => {
    const tRu = createTranslator("ru");

    expect(translateSpecError("Swagger schema validation failed", tRu)).toBe(
      "Swagger schema validation failed",
    );
  });

  it("uses English labels for the English locale", () => {
    const tEn = createTranslator("en");

    expect(
      translateSpecError(
        createCategoryError({
          category: "json",
          detail: "Unexpected end of JSON input",
        }),
        tEn,
      ),
    ).toBe("JSON error: Unexpected end of JSON input");
  });
});
