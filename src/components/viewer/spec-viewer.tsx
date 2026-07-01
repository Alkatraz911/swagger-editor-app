"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSpecStore } from "@/store/spec-store";
import { getEndpoints } from "@/lib/openapi/endpoints";
import { EndpointList, endpointId } from "./endpoint-list";
import { EndpointDetails } from "./endpoint-details";

function CenteredMessage({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint ? <p className="max-w-xs text-sm opacity-60">{hint}</p> : null}
    </div>
  );
}

/**
 * The right pane: reads the shared parsed spec and renders a master-detail
 * view of its operations. Falls back to an empty/invalid state when needed.
 */
export function SpecViewer() {
  const t = useTranslations("viewer");
  const parsedSpec = useSpecStore((state) => state.parsedSpec);
  const errors = useSpecStore((state) => state.errors);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const endpoints = useMemo(() => getEndpoints(parsedSpec), [parsedSpec]);

  if (!parsedSpec) {
    if (errors.length > 0) {
      return (
        <div className="flex h-full flex-col gap-2 overflow-auto p-6">
          <h2 className="text-lg font-semibold">{t("invalidTitle")}</h2>
          <ul className="flex flex-col gap-1 text-sm text-rose-600 dark:text-rose-400">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      );
    }
    return <CenteredMessage title={t("empty")} hint={t("emptyHint")} />;
  }

  if (endpoints.length === 0) {
    return <CenteredMessage title={t("noEndpoints")} />;
  }

  const selected =
    endpoints.find((endpoint) => endpointId(endpoint) === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col divide-y divide-black/10 dark:divide-white/10">
      <div className="max-h-[45%] shrink-0 overflow-auto p-4">
        <EndpointList
          endpoints={endpoints}
          selectedId={selected ? endpointId(selected) : null}
          onSelect={setSelectedId}
        />
      </div>
      <div className="flex-1 overflow-auto p-4">
        {selected ? (
          <EndpointDetails endpoint={selected} />
        ) : (
          <p className="text-sm opacity-60">{t("selectPrompt")}</p>
        )}
      </div>
    </div>
  );
}
