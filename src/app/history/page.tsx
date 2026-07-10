import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HistoryEmptyState } from "@/components/history/history-empty-state";
import { LazyHistoryList } from "@/components/history/lazy-history";
import { getUser } from "@/lib/auth/get-user";
import { getUserRequests } from "@/lib/history/queries";

export default async function HistoryPage() {
  const user = await getUser();
  if (!user) {
    redirect("/");
  }

  const requests = await getUserRequests(user.id);
  const t = await getTranslations("history");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm opacity-70">{t("subtitle")}</p>
      </header>

      {requests.length === 0 ? (
        <HistoryEmptyState
          message={t("emptyMessage")}
          editorLinkLabel={t("goToEditor")}
          viewerLinkLabel={t("goToViewer")}
        />
      ) : (
        <LazyHistoryList requests={requests} />
      )}
    </div>
  );
}
