import { SpecEditor } from "@/components/editor/spec-editor";
import { Pane } from "@/components/pane";
import { SplitView } from "@/components/split-view";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <div className="flex flex-1 flex-col">
      <SplitView
        start={<SpecEditor />}
        end={<Pane title={t("viewerTitle")} hint={t("viewerHint")} />}
      />
    </div>
  );
}
