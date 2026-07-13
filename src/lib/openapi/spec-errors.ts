export const SPEC_ERROR_KEYS = {
  rootMustBeObject: "rootMustBeObject",
  failedToParse: "failedToParse",
  invalidOpenApiDocument: "invalidOpenApiDocument",
} as const;

export type SpecErrorKey = keyof typeof SPEC_ERROR_KEYS;

export const SPEC_ERROR_CATEGORIES = {
  json: "json",
  yaml: "yaml",
  specification: "specification",
} as const;

export type SpecErrorCategory = keyof typeof SPEC_ERROR_CATEGORIES;

const SPEC_ERROR_CATEGORY_PREFIX: Record<SpecErrorCategory, string> = {
  json: "[json]",
  yaml: "[yaml]",
  specification: "[specification]",
};

export type CategorizedSpecError = {
  category: SpecErrorCategory;
  detail: string;
};

type SpecErrorTranslator = (key: string) => string;

export function isSpecErrorKey(error: string): error is SpecErrorKey {
  return error in SPEC_ERROR_KEYS;
}

export function createCategoryError({
  category,
  detail,
}: CategorizedSpecError): string {
  return `${SPEC_ERROR_CATEGORY_PREFIX[category]}${detail}`;
}

export function parseCategoryError(error: string): CategorizedSpecError | null {
  for (const category of Object.keys(
    SPEC_ERROR_CATEGORIES,
  ) as SpecErrorCategory[]) {
    const prefix = SPEC_ERROR_CATEGORY_PREFIX[category];
    if (error.startsWith(prefix)) {
      return {
        category,
        detail: error.slice(prefix.length),
      };
    }
  }

  return null;
}

export function getSpecErrorCategory(
  error: string,
): SpecErrorCategory | SpecErrorKey | null {
  if (isSpecErrorKey(error)) {
    return error;
  }

  return parseCategoryError(error)?.category ?? null;
}

export function translateSpecError(
  error: string,
  t: SpecErrorTranslator,
): string {
  if (isSpecErrorKey(error)) {
    return t(error);
  }

  const categorized = parseCategoryError(error);
  if (categorized) {
    return `${t(categorized.category)}: ${categorized.detail}`;
  }

  return error;
}
