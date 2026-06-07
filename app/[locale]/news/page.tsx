"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Newspaper, X } from "lucide-react";
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

function isImageAttachment(mediaType: string | null | undefined) {
  return mediaType?.toLowerCase().startsWith("image") ?? false;
}

function isLongNewsBody(body: string | null | undefined) {
  return (body?.length ?? 0) > 700 || (body?.split(/\r?\n/).length ?? 0) > 10;
}

const ARABIC_TAG_LABELS: Record<string, string> = {
  book: "كتاب",
  horse: "خيل",
  image: "صورة",
  news: "أخبار",
  stud: "مربط",
  video: "فيديو",
};

function formatNewsTag(category: string, locale: string) {
  if (locale !== "ar") return category;

  return ARABIC_TAG_LABELS[category.trim().toLowerCase()] ?? category;
}

type ImageViewerState = {
  images: string[];
  index: number;
};

function NewsImageGallery({
  images,
  onOpen,
}: {
  images: string[];
  onOpen: (index: number) => void;
}) {
  const visibleImages = images.slice(0, 4);

  if (images.length === 0) return null;

  const gridClass =
    images.length === 1
      ? "grid-cols-1"
      : images.length === 2
        ? "grid-cols-2"
        : "grid-cols-2 grid-rows-2";

  return (
    <div
      className={`grid h-72 gap-1.5 overflow-hidden rounded-xl bg-[#f4efea] sm:h-80 ${gridClass}`}
    >
      {visibleImages.map((image, index) => {
        const isLeadingImage = images.length === 3 && index === 0;
        const remainingCount = images.length - 4;

        return (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => onOpen(index)}
            className={`group relative min-h-0 overflow-hidden bg-[#e9e1da] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4b2f1a]/40 ${
              isLeadingImage ? "row-span-2" : ""
            }`}
            aria-label={`Open image ${index + 1} of ${images.length}`}
          >
            <img
              src={image}
              alt=""
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
            {index === 3 && remainingCount > 0 ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-3xl font-bold text-white">
                +{remainingCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function NewsImageViewer({
  viewer,
  onClose,
  onChange,
}: {
  viewer: ImageViewerState;
  onClose: () => void;
  onChange: (index: number) => void;
}) {
  const { images, index } = viewer;
  const hasMultipleImages = images.length > 1;

  const showPrevious = useCallback(() => {
    onChange((index - 1 + images.length) % images.length);
  }, [images.length, index, onChange]);

  const showNext = useCallback(() => {
    onChange((index + 1) % images.length);
  }, [images.length, index, onChange]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && hasMultipleImages) showPrevious();
      if (event.key === "ArrowRight" && hasMultipleImages) showNext();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasMultipleImages, onClose, showNext, showPrevious]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={onClose}
    >
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between text-white">
          <span className="rounded-full bg-black/45 px-3 py-1 text-sm font-semibold">
            {index + 1} / {images.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 transition hover:bg-white/20"
            aria-label="Close image viewer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <img
          src={images[index]}
          alt=""
          onClick={(event) => event.stopPropagation()}
          className="max-h-full max-w-full select-none object-contain"
        />

        {hasMultipleImages ? (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPrevious();
              }}
              className="absolute start-0 flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-white/20 sm:start-3"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-7 w-7 rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showNext();
              }}
              className="absolute end-0 flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-white/20 sm:end-3"
              aria-label="Next image"
            >
              <ChevronRight className="h-7 w-7 rtl:rotate-180" />
            </button>
          </>
        ) : null}
      </div>

      {hasMultipleImages ? (
        <div
          className="mx-auto mt-3 flex max-w-full gap-2 overflow-x-auto rounded-xl bg-black/35 p-2"
          onClick={(event) => event.stopPropagation()}
        >
          {images.map((image, imageIndex) => (
            <button
              key={`${image}-${imageIndex}`}
              type="button"
              onClick={() => onChange(imageIndex)}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                imageIndex === index ? "border-white opacity-100" : "border-transparent opacity-55 hover:opacity-90"
              }`}
              aria-label={`View image ${imageIndex + 1}`}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function NewsPage() {
  const { direction, locale } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === "rtl";
  const [news, setNews] = useState<ExternalNewsFeedResponse[]>([]);
  const [pageInfo, setPageInfo] = useState<PagedResponse<ExternalNewsFeedResponse> | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [imageViewer, setImageViewer] = useState<ImageViewerState | null>(null);
  const articleRefs = useRef<Record<string, HTMLElement | null>>({});

  const collapseItem = (key: string) => {
    setExpandedItems((current) => ({ ...current, [key]: false }));

    window.requestAnimationFrame(() => {
      articleRefs.current[key]?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  };

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
              const articleKey = `${item.approvalDate ?? "news"}-${index}`;
              const imageUrls = (item.attachments ?? [])
                .filter((attachment) => isImageAttachment(attachment.mediaType))
                .map((attachment) => resolveMediaUrl(attachment.path))
                .filter((path): path is string => Boolean(path));
              const isExpanded = Boolean(expandedItems[articleKey]);
              const canToggleBody = isLongNewsBody(item.body);

              return (
                <article
                  key={articleKey}
                  ref={(node) => {
                    articleRefs.current[articleKey] = node;
                  }}
                  className={`rounded-2xl border border-[#f1ece8] bg-white p-6 shadow-sm ${isRTL ? "text-right" : "text-left"}`}
                  dir={direction}
                >
                  <div className="mb-5 flex items-center gap-4">
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

                  <div className={`grid gap-6 ${imageUrls.length ? "lg:grid-cols-[minmax(20rem,28rem)_1fr]" : ""}`}>
                    <NewsImageGallery
                      images={imageUrls}
                      onOpen={(imageIndex) => setImageViewer({ images: imageUrls, index: imageIndex })}
                    />

                    <div>
                      <p
                        className={`whitespace-pre-line text-lg leading-8 text-[#5c5651] ${
                          canToggleBody && !isExpanded ? "max-h-72 overflow-hidden" : ""
                        }`}
                      >
                        {item.body || t("common.noRecordsFound")}
                      </p>
                      {canToggleBody ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (isExpanded) {
                              collapseItem(articleKey);
                              return;
                            }

                            setExpandedItems((current) => ({ ...current, [articleKey]: true }));
                          }}
                          className="mt-3 text-sm font-bold text-[#4b2f1a] underline-offset-4 hover:underline"
                        >
                          {isExpanded ? t("news.seeLess") : t("news.seeMore")}
                        </button>
                      ) : null}
                      <div className={`mt-5 flex flex-wrap gap-2 ${isRTL ? "justify-end" : "justify-start"}`}>
                        {(item.categories ?? []).map((category) => (
                          <span key={category} className="rounded-full bg-[#f4efea] px-3 py-1 text-sm font-semibold text-[#4b2f1a]">
                            {formatNewsTag(category, locale)}
                          </span>
                        ))}
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

      {imageViewer ? (
        <NewsImageViewer
          viewer={imageViewer}
          onClose={() => setImageViewer(null)}
          onChange={(index) => setImageViewer((current) => current ? { ...current, index } : null)}
        />
      ) : null}
    </MainLayout>
  );
}
