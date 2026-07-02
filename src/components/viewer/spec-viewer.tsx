"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSpecStore } from "@/store/spec-store";
import { getEndpoints } from "@/lib/openapi/endpoints";
import { EndpointList, ServerName } from "./endpoint-list";

/** Dev-only flag: preload a sample spec so the Viewer can be checked in-browser. */
const DEMO_ENABLED = process.env.NEXT_PUBLIC_VIEWER_DEMO === "true";

/** When the demo flag is on and the store is empty, load the Petstore fixture. */
function useDemoSpec() {
  useEffect(() => {
    if (!DEMO_ENABLED || useSpecStore.getState().parsedSpec) return;

    let active = true;
    void import("@/test/fixtures/petstore-spec").then(({ petstoreSpec }) => {
      if (active && !useSpecStore.getState().parsedSpec) {
        useSpecStore
          .getState()
          .setParsedResult({ parsedSpec: petstoreSpec, errors: [] });
      }
    });

    return () => {
      active = false;
    };
  }, []);
}

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

  useDemoSpec();

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

  function handleSelect(id: string) {
    setSelectedId((current) => (current === id ? null : id));
  }

  return (
    <div className="h-full overflow-auto p-4">
      <EndpointList
        serverName={(parsedSpec.servers as ServerName[]) || []}
        endpoints={endpoints}
        selectedId={selectedId}
        onSelect={handleSelect}
        title={
          (parsedSpec.info as { title: string })?.title || "Swagger Viewer"
        }
        description={
          (parsedSpec.info as { description: string })?.description ||
          "Swagger Viewer is a tool that allows you to view and interact with Swagger specifications."
        }
      />
    </div>
  );
}
