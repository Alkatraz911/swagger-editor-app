/** Render an arbitrary value (schema or example) as readable, scrollable JSON. */
export function CodeBlock({
  value,
  contentKey,
}: {
  value: unknown;
  /** Forces a fresh render when the surrounding context changes (e.g. media type). */
  contentKey?: string;
}) {
  return (
    <pre
      key={contentKey}
      className="max-h-80 overflow-auto rounded bg-black/5 p-3 text-xs leading-relaxed dark:bg-white/5"
    >
      <code>{stringify(value)}</code>
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
