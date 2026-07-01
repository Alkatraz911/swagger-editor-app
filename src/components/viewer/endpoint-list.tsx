import { useTranslations } from "next-intl";
import type { Endpoint } from "@/lib/openapi/endpoints";
import { MethodBadge } from "./method-badge";

/** Stable identity for an operation (a path may host several methods). */
export function endpointId(endpoint: Endpoint): string {
  return `${endpoint.method}:${endpoint.path}`;
}

interface PathGroup {
  path: string;
  items: Endpoint[];
}

/** Group operations by their path while preserving the original order. */
function groupByPath(endpoints: Endpoint[]): PathGroup[] {
  const groups: PathGroup[] = [];
  const index = new Map<string, PathGroup>();

  for (const endpoint of endpoints) {
    let group = index.get(endpoint.path);
    if (!group) {
      group = { path: endpoint.path, items: [] };
      index.set(endpoint.path, group);
      groups.push(group);
    }
    group.items.push(endpoint);
  }
  return groups;
}

interface EndpointListProps {
  endpoints: Endpoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Operations grouped by path/method with a color-coded method badge. */
export function EndpointList({
  endpoints,
  selectedId,
  onSelect,
}: EndpointListProps) {
  const t = useTranslations("viewer");

  return (
    <nav aria-label={t("endpoints")} className="flex flex-col gap-4">
      {groupByPath(endpoints).map((group) => (
        <div key={group.path}>
          <h3 className="mb-1 font-mono text-xs break-all opacity-60">
            {group.path}
          </h3>
          <ul className="flex flex-col gap-1">
            {group.items.map((endpoint) => {
              const id = endpointId(endpoint);
              const isSelected = id === selectedId;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onSelect(id)}
                    aria-current={isSelected}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-black/10 dark:bg-white/15"
                        : "hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                  >
                    <MethodBadge method={endpoint.method} />
                    <span className="truncate">
                      {endpoint.summary ?? endpoint.path}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
