import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LazyRequestDetail } from "@/components/history/lazy-history";
import { getUser } from "@/lib/auth/get-user";
import { getUserRequest } from "@/lib/history/queries";

type HistoryDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HistoryDetailPage({
  params,
}: HistoryDetailPageProps) {
  const { id } = await params;
  const user = await getUser();
  if (!user) {
    redirect("/");
  }

  const request = await getUserRequest(user.id, id);
  if (!request) {
    notFound();
  }

  const t = await getTranslations("history");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{t("detailTitle")}</h1>
        <p className="text-sm opacity-70">{t("detailSubtitle")}</p>
      </header>

      <LazyRequestDetail request={request} />
    </div>
  );
}
