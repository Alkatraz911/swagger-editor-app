import dynamic from "next/dynamic";

const tableSkeleton = (
  <div
    aria-hidden="true"
    className="h-48 animate-pulse rounded-lg border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5"
  />
);

const detailSkeleton = (
  <div
    aria-hidden="true"
    className="h-64 animate-pulse rounded-lg border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5"
  />
);

export const LazyHistoryList = dynamic(
  () =>
    import("@/components/history/history-list").then(
      (module) => module.HistoryList,
    ),
  {
    ssr: true,
    loading: () => tableSkeleton,
  },
);

export const LazyRequestDetail = dynamic(
  () =>
    import("@/components/history/request-detail").then(
      (module) => module.RequestDetail,
    ),
  {
    ssr: true,
    loading: () => detailSkeleton,
  },
);
