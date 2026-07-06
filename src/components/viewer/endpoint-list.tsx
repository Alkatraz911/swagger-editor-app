import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Endpoint } from "@/lib/openapi/endpoints";
import { MethodBadge, METHOD_BORDER_BACKGROUND_COLORS } from "./method-badge";
import { EndpointDetails } from "./endpoint-details";
import { CopyIcon } from "@/icons/copy-icon";
import { ArrowIcon } from "@/icons/arrow";

/** Stable identity for an operation (a path may host several methods). */
export function endpointId(endpoint: Endpoint): string {
  return `${endpoint.method}:${endpoint.path}`;
}

interface PathGroup {
  path: string;
  items: Endpoint[];
}

export interface ServerName {
  url: string;
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

/** Slides open/closed via CSS Grid — no effect needed, `open` drives the transition. */
function ExpandableDetails({
  open,
  rowColor,
  endpoint,
}: {
  open: boolean;
  rowColor: string;
  endpoint: Endpoint;
}) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-in-out"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      aria-hidden={!open}
    >
      <div className="overflow-hidden">
        <div
          className={`border-t border-black/5 p-4 dark:border-white/5 ${rowColor} rounded-b`}
        >
          <EndpointDetails endpoint={endpoint} />
        </div>
      </div>
    </div>
  );
}

interface EndpointListProps {
  serverName: ServerName[];
  endpoints: Endpoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  title: string;
  description: string;
}

/** Operations grouped by path/method with expandable details under each row. */
export function EndpointList({
  serverName,
  endpoints,
  selectedId,
  onSelect,
  title,
  description,
}: EndpointListProps) {
  const t = useTranslations("viewer");
  const [selectedServerName, setSelectedServerName] = useState<ServerName>(
    serverName[0] ?? { url: "" },
  );

  return (
    <>
      <div className="flex flex-col items-center justify-between">
        <h2 className="mb-2 text-center text-xl font-bold">{title}</h2>
        <p className="mb-4 text-sm text-black-500 dark:text-black-400">
          {description}
        </p>
      </div>

      {serverName.length > 0 ? (
        <div className="mb-4 flex flex-col gap-2">
          <label htmlFor="serverName" className="text-xs font-bold">
            Servers:
          </label>
          <select
            name="serverName"
            id="serverName"
            className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-700"
            value={selectedServerName.url}
            onChange={(e) => setSelectedServerName({ url: e.target.value })}
          >
            {serverName.map((server) => (
              <option key={server.url} value={server.url}>
                {server.url}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <nav aria-label={t("endpoints")} className="flex flex-col gap-4">
        {groupByPath(endpoints).map((group) => (
          <div key={group.path}>
            <ul className="flex flex-col gap-1">
              {group.items.map((endpoint) => {
                const id = endpointId(endpoint);
                const isSelected = id === selectedId;
                const rowColor =
                  METHOD_BORDER_BACKGROUND_COLORS[endpoint.method];

                return (
                  <li key={id} className="overflow-hidden rounded">
                    <button
                      type="button"
                      onClick={() => onSelect(id)}
                      aria-expanded={isSelected}
                      aria-current={isSelected}
                      className={`flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors ${rowColor} ${
                        isSelected ? "rounded-t" : "rounded"
                      }`}
                    >
                      <MethodBadge method={endpoint.method} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {group.path}
                      </span>
                      <span className="truncate">
                        {endpoint.summary ?? endpoint.path}
                      </span>

                      <CopyIcon text={selectedServerName.url + group.path} />
                      <ArrowIcon
                        className={`shrink-0 transition-transform duration-300 ease-in-out ${
                          isSelected ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </button>

                    <ExpandableDetails
                      open={isSelected}
                      rowColor={rowColor}
                      endpoint={endpoint}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
