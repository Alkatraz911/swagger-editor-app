import { useTranslations } from "next-intl";
import type { Endpoint } from "@/lib/openapi/endpoints";
import { MethodBadge } from "./method-badge";
import { METHOD_BORDER_BACKGROUND_COLORS } from "./method-badge";
import { useState } from "react";
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

interface EndpointListHeaderProps {
  title: string;
  description: string;
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
  serverName: ServerName[];
  endpoints: Endpoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  title: string;
  description: string;
}

/** Operations grouped by path/method with a color-coded method badge. */
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
    serverName[0],
  );
  return (
    <>
      <div className="flex justify-between items-center flex-col">
        <h2 className="text-xl font-bold text-center mb-2">{title}</h2>
        <p className="text-sm text-black-500 dark:text-black-400 mb-4">
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <label htmlFor="serverName" className="text-xs font-bold">
          Servers:
        </label>
        <select
          name="serverName"
          id="serverName"
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 p-2"
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
      <nav aria-label={t("endpoints")} className="flex flex-col gap-4">
        {groupByPath(endpoints).map((group) => (
          <div key={group.path}>
            {/* <h3 className="mb-1 font-mono text-xs break-all opacity-60">
              {group.path}
            </h3> */}
            <ul className="flex flex-col gap-1">
              {group.items.map((endpoint) => {
                const id = endpointId(endpoint);
                const isSelected = id === selectedId;
                return (
                  <li key={id}>
                    <div
                      onClick={() => onSelect(id)}
                      aria-current={isSelected}
                      className={`cursor-pointer flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors border border-black/10 dark:border-white/10 ${METHOD_BORDER_BACKGROUND_COLORS[endpoint.method]}
                  `}
                    >
                      <MethodBadge method={endpoint.method} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {group.path}
                      </span>
                      <span className="truncate">
                        {endpoint.summary ?? endpoint.path}
                      </span>

                      <CopyIcon text={selectedServerName.url + group.path} />
                      <ArrowIcon />
                    </div>
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
