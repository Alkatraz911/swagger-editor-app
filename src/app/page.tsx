import { getTranslations } from "next-intl/server";
import { SplitView } from "@/components/split-view";

function Pane({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-xs text-sm opacity-60">{hint}</p>
    </div>
  );
}

export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <div className="flex flex-1 flex-col">
      <SplitView
        start={<Pane title={t("editorTitle")} hint={t("editorHint")} />}
        end={<Pane title={t("viewerTitle")} hint={t("viewerHint")} />}
      />
    </div>
  );
}
