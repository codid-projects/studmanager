"use client";

import { FC, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useLocale } from "@/lib/locale-context";
import { X } from "lucide-react";
import { getHorsePedigree } from "@/lib/api/external-horses";
import { getLocalizedName } from "@/lib/api/localization";

interface Horse {
  id?: string;
  studbookId?: number | null;
  name?: string;
  pedigreeImage?: string;
}

interface HorsePedigreeTreeProps {
  horse: Horse;
  showTitle?: boolean;
  controlsVariant?: "default" | "compact";
  pedigreeData?: unknown;
  loading?: boolean;
}

type ParentRole = "Root" | "Mother" | "Father";

type PedigreeNode = {
  id: string;
  name: string;
  role: ParentRole;
  duplicateColor?: { background: string; border: string };
};

const NODE_HEIGHT_PX = 18;
const CERTIFICATE_ASPECT = 1600 / 900;
const DUPLICATE_ANCESTOR_COLORS = [
  { background: "#FEE2E2", border: "#DC2626" },
  { background: "#CCFBF1", border: "#0F766E" },
  { background: "#FEF9C3", border: "#CA8A04" },
  { background: "#D9F99D", border: "#65A30D" },
  { background: "#D1FAE5", border: "#059669" },
  { background: "#DBEAFE", border: "#2563EB" },
  { background: "#E0E7FF", border: "#4F46E5" },
  { background: "#FAE8FF", border: "#C026D3" },
];

const getTopPercent = (count: number, index: number, maxLeafCount: number) => {
  const span = maxLeafCount / count;
  const center = index * span + span / 2;
  return (center / maxLeafCount) * 100;
};

const normalizePedigreeLevels = (payload: unknown): unknown[][] => {
  if (Array.isArray(payload)) return payload.filter(Array.isArray) as unknown[][];

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.ancestors)) {
      const ancestors = record.ancestors.filter(Array.isArray) as unknown[][];
      return record.root ? [[record.root], ...ancestors] : ancestors;
    }
    if (Array.isArray(record.data)) return record.data.filter(Array.isArray) as unknown[][];
    if (Array.isArray(record.levels)) return record.levels.filter(Array.isArray) as unknown[][];
  }

  return [];
};

const ParentIcon = ({ role }: { role: ParentRole }) => {
  if (role === "Root") return null;

  return (
    null
    // <span
    //   className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold leading-none ${
    //     role === "Mother"
    //       ? "bg-[#f8dce7] text-[#9b315a]"
    //       : "bg-[#dce9fb] text-[#285c9f]"
    //   }`}
    //   title={role}
    //   aria-label={role}
    // >
    //   {role === "Mother" ? "♀" : "♂"}
    // </span>
  );
};

function getDuplicateColorMap(columns: PedigreeNode[][]) {
  const counts = new Map<string, number>();
  const colors = new Map<string, { background: string; border: string }>();

  columns.flat().forEach((node) => {
    if (node.role === "Root") return;
    counts.set(node.id, (counts.get(node.id) ?? 0) + 1);
  });

  let colorIndex = 0;
  counts.forEach((count, id) => {
    if (count > 1) {
      colors.set(id, DUPLICATE_ANCESTOR_COLORS[colorIndex % DUPLICATE_ANCESTOR_COLORS.length]);
      colorIndex += 1;
    }
  });

  return colors;
}

const mapPedigreeLevels = (levels: unknown[][], isRTL: boolean): PedigreeNode[][] => {
  const mapped = levels.map((generation, generationIndex) =>
    generation.map((nodeValue, nodeIndex) => {
      const node = nodeValue && typeof nodeValue === "object" ? nodeValue as Record<string, unknown> : {};

      return {
        id: String(node.id ?? `${generationIndex}-${nodeIndex}`),
        name: getLocalizedName(
          typeof node.englishName === "string" ? node.englishName : null,
          typeof node.arabicName === "string" ? node.arabicName : null,
          isRTL,
        ),
        role: (generationIndex === 0 ? "Root" : nodeIndex % 2 === 0 ? "Father" : "Mother") as ParentRole,
      };
    }),
  ).filter((column) => column.length);

  const duplicateColors = getDuplicateColorMap(mapped);

  return mapped.map((column) =>
    column.map((node) => ({
      ...node,
      duplicateColor: duplicateColors.get(node.id),
    })),
  );
};

const waitForRenderableImages = async (container: HTMLElement) => {
  const images = Array.from(container.querySelectorAll("img"));

  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }

          const done = () => {
            img.removeEventListener("load", done);
            img.removeEventListener("error", done);
            resolve();
          };

          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }),
    ),
  );
};

const DownloadIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5" />
    <path d="M12 15V3" />
  </svg>
);

const ExpandIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M15 3h6v6" />
    <path d="M9 21H3v-6" />
    <path d="M21 3l-7 7" />
    <path d="M3 21l7-7" />
  </svg>
);

const PedigreeBox = ({ node, top }: { node: PedigreeNode; top: number }) => {
  return (
    <div
      dir="ltr"
      className="absolute left-0 right-0 px-[2px]"
      style={{
        top: `calc(${top}% - ${NODE_HEIGHT_PX / 2}px)`,
        height: `${NODE_HEIGHT_PX}px`,
      }}
    >
      <div
        className="flex h-full w-full items-center justify-center gap-1 rounded-[8px] border border-dashed border-[#bbb3aa] bg-[#f7f3ee]/80 px-1.5 text-center font-serif text-[8px] leading-none text-[#2c3953] shadow-[0_1px_0_rgba(0,0,0,0.02)] sm:text-[8.5px] md:text-[9px] lg:text-[9.5px] xl:text-[10px]"
        style={node.duplicateColor ? {
          backgroundColor: node.duplicateColor.background,
          borderColor: node.duplicateColor.border,
        } : undefined}
      >
        <ParentIcon role={node.role} />
        <span className="block min-w-0 truncate whitespace-nowrap">
          {node.name}
        </span>
      </div>
    </div>
  );
};

export const HorsePedigreeTree: FC<HorsePedigreeTreeProps> = ({
  horse,
  showTitle = true,
  controlsVariant = "default",
  pedigreeData,
  loading = false,
}) => {
  const { direction } = useLocale();
  const isRTL = direction === "rtl";
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [apiColumns, setApiColumns] = useState<PedigreeNode[][]>([]);
  const [isTreeLoading, setIsTreeLoading] = useState(Boolean(horse.studbookId) || loading);
  const [treeError, setTreeError] = useState("");

  const orderedColumns = useMemo(() => {
    return isRTL ? [...apiColumns].reverse() : apiColumns;
  }, [apiColumns, isRTL]);
  const maxLeafCount = useMemo(
    () => Math.max(1, ...apiColumns.map((column) => column.length)),
    [apiColumns],
  );
  const hasPedigree = apiColumns.length > 0;
  const certificateMinWidth = Math.max(980, apiColumns.length * 190);

  useEffect(() => {
    if (pedigreeData !== undefined) {
      setTreeError("");
      setIsTreeLoading(loading);

      if (!loading) {
        setApiColumns(mapPedigreeLevels(normalizePedigreeLevels(pedigreeData), isRTL));
      }

      return;
    }

    if (!horse.studbookId) {
      setApiColumns([]);
      setIsTreeLoading(false);
      setTreeError("");
      return;
    }

    let mounted = true;

    async function loadPedigree() {
      setIsTreeLoading(true);
      setTreeError("");
      setApiColumns([]);

      try {
        const result = await getHorsePedigree({ studbookId: horse.studbookId as number, levels: 6 });
        const levels = normalizePedigreeLevels(result.data);
        if (mounted) {
          setApiColumns(mapPedigreeLevels(levels, isRTL));
        }
      } catch (requestError) {
        if (mounted) {
          setTreeError(
            requestError instanceof Error
              ? requestError.message
              : isRTL
                ? "تعذر تحميل بيانات النسب الخارجية"
                : "Failed to load external pedigree data",
          );
        }
      } finally {
        if (mounted) setIsTreeLoading(false);
      }
    }

    loadPedigree();

    return () => {
      mounted = false;
    };
  }, [horse.studbookId, isRTL, pedigreeData, loading]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobileViewport(media.matches);

    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (isMobileViewport) return;

      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [isMobileViewport]);

  useEffect(() => {
    if (!isMobileViewport) return;

    const previousOverflow = document.body.style.overflow;
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen, isMobileViewport]);

  const handleToggleFullscreen = async () => {
    if (!fullscreenRef.current) return;

    if (isMobileViewport) {
      setIsFullscreen((current) => !current);
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await fullscreenRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  const handleDownload = async () => {
    if (!exportRef.current || isDownloading) return;

    try {
      setIsDownloading(true);
      await waitForRenderableImages(exportRef.current);

      const exportWidth = exportRef.current.scrollWidth;
      const exportHeight = exportRef.current.scrollHeight;

      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#f7f3ee",
        width: exportWidth,
        height: exportHeight,
        canvasWidth: exportWidth * 3,
        canvasHeight: exportHeight * 3,
        skipAutoScale: true,
      });

      const link = document.createElement("a");
      const safeName = (horse?.name || "horse-pedigree")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");

      link.href = dataUrl;
      link.download = `${safeName || "horse-pedigree"}-certificate.png`;
      link.click();
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="mx-auto mb-8 w-full max-w-[1500px]"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className="mb-4 flex flex-col items-start gap-3 px-1 sm:flex-row sm:items-center sm:justify-between"
        dir={controlsVariant === "compact" && !showTitle ? "ltr" : undefined}
      >
        {showTitle && (
          <h2 className="text-xl font-bold text-[#2a2a2a] sm:text-2xl">
            {isRTL ? "شهادة النسب" : "Pedigree Certificate"}
          </h2>
        )}

        <div className="flex w-auto items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading || !hasPedigree}
            className={`inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap bg-white font-semibold text-[#3e3640] transition hover:bg-[#f8f3ed] disabled:cursor-not-allowed disabled:opacity-60 ${
              controlsVariant === "compact"
                ? "h-11 w-11 rounded-xl border border-[#e6ddd4]"
                : "h-11 rounded-2xl px-4 text-sm"
            }`}
            title={isRTL ? "تحميل" : "Download"}
          >
            <DownloadIcon className="h-5 w-5" />
            {controlsVariant === "default" ? (
              <span>
                {isDownloading
                  ? isRTL
                    ? "جاري التحميل..."
                    : "Downloading..."
                  : isRTL
                    ? "تحميل"
                    : "Download"}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            disabled={!hasPedigree}
            className={`inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap bg-white font-semibold text-[#3e3640] transition hover:bg-[#f8f3ed] ${
              controlsVariant === "compact"
                ? "h-11 w-11 rounded-xl border border-[#e6ddd4]"
                : "h-11 rounded-2xl px-4 text-sm"
            } disabled:cursor-not-allowed disabled:opacity-50`}
            title={
              isFullscreen
                ? isRTL
                  ? "تصغير"
                  : "Exit Fullscreen"
                : isRTL
                  ? "تكبير"
                  : "Expand"
            }
          >
            <ExpandIcon className="h-5 w-5" />
            {controlsVariant === "default" ? (
              <span>
                {isFullscreen
                  ? isRTL
                    ? "تصغير"
                    : "Exit"
                  : isRTL
                    ? "تكبير"
                    : "Expand"}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {treeError ? (
        <div className="mb-4 rounded-2xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444]">
          {treeError}
        </div>
      ) : null}

      {isTreeLoading ? (
        <div className="rounded-[26px] bg-[#efeae5] p-3">
          <div className="relative aspect-[1600/900] min-w-[980px] overflow-hidden rounded-[20px] bg-[#f7f3ee] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="grid h-full grid-cols-5 gap-x-4 px-8 py-10" dir={isRTL ? "rtl" : "ltr"}>
              {(isRTL ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4]).map((columnIndex) => (
                <div key={columnIndex} className="flex flex-col justify-around">
                  {Array.from({ length: 2 ** Math.min(columnIndex + 1, 5) }).map((__, itemIndex) => (
                    <div key={itemIndex} className="flex h-[18px] items-center gap-1 rounded-[8px] bg-[#ded6cf] px-1.5">
                      {columnIndex > 0 ? <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-[#cfc6be]" /> : null}
                      <span className="h-2 flex-1 rounded-full bg-[#cfc6be]" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !hasPedigree ? (
        <div className="rounded-[26px] border border-dashed border-[#d9c8ba] bg-white p-10 text-center text-sm text-[#7a6c63]">
          {horse.studbookId
            ? isRTL
              ? "لا توجد بيانات نسب متاحة لهذا الخيل."
              : "No pedigree data is available for this horse."
            : isRTL
              ? "لا يوجد رقم Studbook لهذا الخيل لعرض شهادة النسب."
              : "No studbook id is available for this horse pedigree."}
        </div>
      ) : (

      <div
        ref={fullscreenRef}
        className={`rounded-[26px] bg-[#efeae5] p-2 sm:p-3 ${
          isFullscreen && !isMobileViewport
            ? "flex min-h-screen items-center justify-center bg-[#efeae5]"
            : ""
        } ${
          isFullscreen && isMobileViewport
            ? "fixed inset-0 z-[70] rounded-none bg-[#efeae5] p-3"
            : ""
        }`}
      >
        {isFullscreen && isMobileViewport && (
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className={`absolute top-4 z-[80] flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#3e3640] shadow-md ${
              isRTL ? "left-4" : "right-4"
            }`}
            aria-label={isRTL ? "إغلاق" : "Close"}
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div
          className={`w-full overflow-x-auto overflow-y-hidden rounded-[22px] ${
            isFullscreen && !isMobileViewport
              ? "flex items-center justify-center overflow-hidden"
              : ""
          } ${
            isFullscreen && isMobileViewport ? "h-full overflow-auto" : ""
          }`}
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorX: "contain",
            overscrollBehaviorY: isFullscreen ? "contain" : "auto",
            touchAction: isFullscreen && isMobileViewport
              ? "pan-x pan-y pinch-zoom"
              : "pan-y pan-x",
          }}
        >
          <div
            ref={exportRef}
            className="relative overflow-hidden rounded-[20px] bg-[#f7f3ee] shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
            style={{
              aspectRatio: `${CERTIFICATE_ASPECT}`,
              width:
                isFullscreen && isMobileViewport
                  ? `${certificateMinWidth}px`
                  : isFullscreen
                    ? `min(96vw, calc((100dvh - 72px) * ${CERTIFICATE_ASPECT}))`
                    : "100%",
              minWidth: isFullscreen && !isMobileViewport ? undefined : `${certificateMinWidth}px`,
              maxWidth: isFullscreen ? undefined : "1500px",
            }}
          >
            <img
              src="/horse/border.png"
              alt="Border Frame"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill"
            />

            <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-8">
              <img
                src="/horse/centerinnerlogoofpedgree.svg"
                alt="Pedigree Center Logo"
                className="h-auto w-[28%] max-w-[340px] object-contain"
              />
            </div>

            <div className="relative z-10 h-full px-5 pb-8 pt-8 sm:px-7 sm:pb-10 sm:pt-10 lg:px-8 lg:pb-12 lg:pt-12 xl:px-10">
              <div
                className="grid h-full w-full gap-x-3 md:gap-x-4 lg:gap-x-5"
                style={{
                  gridTemplateColumns: `repeat(${orderedColumns.length}, minmax(0, 1fr))`,
                }}
              >
                {orderedColumns.map((column, columnIndex) => (
                  <div
                    key={`column-${columnIndex}`}
                    className="relative h-full"
                  >
                    {column.map((node, nodeIndex) => (
                      <PedigreeBox
                        key={node.id}
                        node={node}
                        top={getTopPercent(column.length, nodeIndex, maxLeafCount)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`pointer-events-none absolute bottom-8 z-20 h-8 w-24 sm:bottom-5 sm:h-9 sm:w-28 md:h-10 md:w-32 ${
                isRTL ? "left-8 sm:left-8" : "left-4 sm:left-5"
              }`}
            >
              <img
                src="/horse/studbooklogo.png"
                alt="Studbook Logo"
                className="h-full w-full object-contain object-left"
              />
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
