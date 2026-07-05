"use client";

import { useState } from "react";

/** Render an arbitrary value (schema or example) as readable, scrollable JSON. */

const SCHEMA_TYPES = new Set([
  "object",
  "array",
  "string",
  "integer",
  "number",
  "boolean",
  "null",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodePointerSegment(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function resolveRef(
  root: Record<string, unknown>,
  node: unknown,
  seen: Set<string> = new Set(),
): Record<string, unknown> | undefined {
  if (!isRecord(node)) return undefined;

  const ref = node.$ref;
  if (typeof ref !== "string") return node;
  if (!ref.startsWith("#/") || seen.has(ref)) return undefined;
  seen.add(ref);

  const segments = ref.slice(2).split("/").map(decodePointerSegment);
  let current: unknown = root;
  for (const segment of segments) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }

  return resolveRef(root, current, seen);
}

function isJsonSchema(value: Record<string, unknown>): boolean {
  if ("$ref" in value) return true;
  if ("properties" in value && isRecord(value.properties)) return true;
  if ("items" in value) return true;
  if ("enum" in value && Array.isArray(value.enum)) return true;
  if ("allOf" in value || "oneOf" in value || "anyOf" in value) return true;
  return typeof value.type === "string" && SCHEMA_TYPES.has(value.type);
}

function firstEnumValue(schema: Record<string, unknown>): unknown {
  const enumValues = schema.enum;
  if (Array.isArray(enumValues) && enumValues.length > 0) return enumValues[0];
  return undefined;
}

/**
 * Build an example object from a JSON Schema fragment:
 * - use `example` when present on a node;
 * - use the first `enum` value when no example is set;
 * - recurse into `properties` and resolved `$ref`s;
 * - for arrays, wrap the item example in `[...]`.
 */
function schemaToExample(
  schema: unknown,
  root: Record<string, unknown> | undefined,
  seenRefs: Set<string> = new Set(),
): unknown {
  if (!isRecord(schema)) return undefined;

  if (typeof schema.$ref === "string") {
    if (!root) return undefined;
    const resolved = resolveRef(root, schema, seenRefs);
    if (!resolved) return undefined;
    return schemaToExample(resolved, root, seenRefs);
  }

  if (schema.example !== undefined) return schema.example;

  for (const key of ["allOf", "oneOf", "anyOf"] as const) {
    const parts = schema[key];
    if (Array.isArray(parts) && parts.length > 0) {
      return schemaToExample(parts[0], root, seenRefs);
    }
  }

  if (isRecord(schema.properties)) {
    const result: Record<string, unknown> = {};
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const value = schemaToExample(propSchema, root, seenRefs);
      if (value !== undefined) result[key] = value;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  if (schema.type === "array" || schema.items !== undefined) {
    const itemExample = schemaToExample(schema.items, root, seenRefs);
    if (itemExample !== undefined) return [itemExample];

    if (isRecord(schema.items)) {
      const placeholder = itemsTypeValue(schema.items, root, seenRefs);
      if (placeholder !== undefined) return [placeholder];
    }
  }

  const enumValue = firstEnumValue(schema);
  if (enumValue !== undefined) return enumValue;

  return undefined;
}

/** Fallback value for array items when no explicit `example` is defined. */
function itemsTypeValue(
  items: Record<string, unknown>,
  root: Record<string, unknown> | undefined,
  seenRefs: Set<string>,
): unknown {
  if (typeof items.$ref === "string") {
    if (!root) return undefined;
    const resolved = resolveRef(root, items, new Set());
    if (!resolved) return undefined;
    const fromSchema = schemaToExample(resolved, root, seenRefs);
    if (fromSchema !== undefined) return fromSchema;
    return itemsTypeValue(resolved, root, seenRefs);
  }

  if (items.example !== undefined) return items.example;

  const enumValue = firstEnumValue(items);
  if (enumValue !== undefined) return enumValue;

  const itemType = items.type;
  if (itemType === "string") return "string";
  if (itemType === "integer" || itemType === "number") return 0;
  if (itemType === "boolean") return false;

  if (itemType === "object" && isRecord(items.properties)) {
    const result: Record<string, unknown> = {};
    for (const [key, propSchema] of Object.entries(items.properties)) {
      const value =
        schemaToExample(propSchema, root, seenRefs) ??
        (isRecord(propSchema)
          ? itemsTypeValue(propSchema, root, seenRefs)
          : undefined);
      if (value !== undefined) result[key] = value;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  return undefined;
}

/** Turn a JSON Schema into an example payload; pass plain values through unchanged. */
export function transformValue(
  value: unknown,
  root?: Record<string, unknown>,
): unknown {
  if (!isRecord(value) || !isJsonSchema(value)) return value;

  return schemaToExample(value, root) ?? value;
}

const BLOCK_CLASS =
  "h-[320px] w-full overflow-auto rounded bg-black/5 p-3 font-mono text-xs leading-relaxed dark:bg-white/5";

function EditableCodeBlock({
  contentKey,
  initialText,
}: {
  contentKey?: string;
  initialText: string;
}) {
  const [draft, setDraft] = useState(initialText);

  return (
    <textarea
      key={contentKey}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      className={`${BLOCK_CLASS} resize-y border border-black/10 bg-white dark:border-white/10 dark:bg-white/5`}
      spellCheck={false}
    />
  );
}

export function CodeBlock({
  value,
  contentKey,
  root,
  editable = false,
}: {
  value: unknown;
  /** Forces a fresh render when the surrounding context changes (e.g. media type). */
  contentKey?: string;
  /** Root OpenAPI document — required to resolve local `$ref`s when building examples. */
  root?: Record<string, unknown>;
  /** When true, the user can edit the rendered JSON text. */
  editable?: boolean;
}) {
  const readOnlyText = stringify(transformValue(value, root));

  if (editable) {
    return (
      <EditableCodeBlock
        key={`${contentKey ?? "block"}-${readOnlyText}`}
        contentKey={contentKey}
        initialText={readOnlyText}
      />
    );
  }

  return (
    <pre key={contentKey} className={BLOCK_CLASS}>
      <code>{readOnlyText}</code>
    </pre>
  );
}

function stringify(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
