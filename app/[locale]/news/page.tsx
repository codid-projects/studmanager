"use client";

import { useEffect, useState } from "react";
import { Heart, MessageCircle, Newspaper } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { clientApiFetch } from "@/lib/api/client";
import { API_BASE_URL } from "@/lib/api/transport";
import { useLocale, useTranslation } from "@/lib/locale-context";
import type { ExternalNewsFeedResponse, PagedResponse } from "@/lib/api/types";

function resolveMediaUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}/${path.replace(/^\//, "")}`;
}

function formatDate(value: string | null, locale: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export default function NewsPage() {
  const { direction, locale } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === "rtl";
  const [news, setNews] = useState<ExternalNewsFeedResponse[]>([]);
  const [pageInfo, setPageInfo] = useState<PagedResponse<ExternalNewsFeedResponse> | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadNews() {
      setLoading(true);

      try {
        const result = await clientApiFetch<PagedResponse<ExternalNewsFeedResponse>>({
          backendPath: "/api/ExternalHorses/newsfeed",
          nextPath: "/api/newsfeed",
          query: { pageNumber, pageSize: 10, locale },
          locale,
        });

        if (!mounted) return;
        setPageInfo(result);
        setNews(result.data ?? []);
      } catch {
        if (!mounted) return;
        setPageInfo(null);
        setNews([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadNews();

    return () => {
      mounted = false;
    };
  }, [locale, pageNumber]);

  return (
    <MainLayout>
      <div className="mx-auto max-w-[1180px] p-4 sm:p-6" dir={direction}>
        <h1 className="mb-8 text-start text-3xl font-bold text-[#3b2b20]">
          {t("news.title")}
        </h1>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-lg font-semibold text-[#6f665e]">
            {t("common.loading")}
          </div>
        ) : news.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-lg font-semibold text-[#6f665e]">
            {t("common.noRecordsFound")}
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((item, index) => {
              const imageUrl = resolveMediaUrl(item.attachments?.find((attachment) => attachment.mediaType?.startsWith("image"))?.path);

              return (
                <article
                  key={`${item.approvalDate ?? "news"}-${index}`}
                  className="rounded-2xl border border-[#f1ece8] bg-white p-6 shadow-sm"
                >
                  <div className={`mb-5 flex items-center gap-4 ${isRTL ? "flex-row-reverse text-right" : "text-left"}`}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#4b2f1a] text-white">
                      <Newspaper className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-bold text-[#3b2b20]">
                        {item.userName || t("news.title")}
                      </h2>
                      <p className="mt-1 text-sm text-[#8c847c]">{formatDate(item.approvalDate, locale)}</p>
                    </div>
                  </div>

                  <div className={`grid gap-6 ${imageUrl ? "lg:grid-cols-[20rem_1fr]" : ""}`}>
                    {imageUrl && (
                      <div className="overflow-hidden rounded-xl bg-[#f4efea]">
                        <img src={imageUrl} alt="" className="h-60 w-full object-cover" />
                      </div>
                    )}

                    <div className={`${isRTL ? "text-right" : "text-left"}`}>
                      <p className="whitespace-pre-line text-lg leading-8 text-[#5c5651]">
                        {item.body || t("common.noRecordsFound")}
                      </p>
                      <div className={`mt-5 flex flex-wrap gap-2 ${isRTL ? "justify-end" : "justify-start"}`}>
                        {(item.categories ?? []).map((category) => (
                          <span key={category} className="rounded-full bg-[#f4efea] px-3 py-1 text-sm font-semibold text-[#4b2f1a]">
                            {category}
                          </span>
                        ))}
                      </div>
                      <div className={`mt-5 flex items-center gap-5 text-sm font-semibold text-[#6f665e] ${isRTL ? "justify-end" : "justify-start"}`}>
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {item.likesCount ?? 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {item.commentsCount ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            disabled={!pageInfo?.hasPreviousPage || loading}
            onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#4b2f1a] disabled:opacity-40"
          >
            {t("common.back")}
          </button>
          <span className="text-sm font-semibold text-[#6f665e]">
            {pageInfo?.currentPage ?? pageNumber} / {pageInfo?.totalPages || 1}
          </span>
          <button
            disabled={!pageInfo?.hasNextPage || loading}
            onClick={() => setPageNumber((page) => page + 1)}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#4b2f1a] disabled:opacity-40"
          >
            {t("common.next")}
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
