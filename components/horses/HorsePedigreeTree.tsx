"use client";

import { FC, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { toPng } from "html-to-image";
import { useLocale } from "@/lib/locale-context";
import { X } from "lucide-react";

interface Horse {
  id?: string;
  name?: string;
  pedigreeImage?: string;
}

interface HorsePedigreeTreeProps {
  horse: Horse;
  showTitle?: boolean;
  controlsVariant?: "default" | "compact";
}

type ParentRole = "Mother" | "Father";

type PedigreeNode = {
  id: string;
  name: string;
  role: ParentRole;
};

const NODE_HEIGHT_PX = 18;
const CERTIFICATE_ASPECT = 1600 / 900;

const pedigreeMockData: PedigreeNode[][] = [
  [
    { id: "g1-1", name: "Ahlam II", role: "Mother" },
    { id: "g1-2", name: "Nazeer", role: "Father" },
  ],
  [
    { id: "g2-1", name: "Bint Zareefa", role: "Mother" },
    { id: "g2-2", name: "Sid Abouhom", role: "Father" },
    { id: "g2-3", name: "Bint Samiha", role: "Mother" },
    { id: "g2-4", name: "Mansour", role: "Father" },
  ],
  [
    { id: "g3-1", name: "Zareefa", role: "Mother" },
    { id: "g3-2", name: "Balance", role: "Father" },
    { id: "g3-3", name: "Layla", role: "Mother" },
    { id: "g3-4", name: "Al Deree", role: "Father" },
    { id: "g3-5", name: "Samieha", role: "Mother" },
    { id: "g3-6", name: "Kazmeen", role: "Father" },
    { id: "g3-7", name: "Nafaa El Saghira", role: "Mother" },
    { id: "g3-8", name: "Gamil Manial", role: "Father" },
  ],
  [
    { id: "g4-1", name: "Dorra", role: "Mother" },
    { id: "g4-2", name: "Kazmeen", role: "Father" },
    { id: "g4-3", name: "Farida", role: "Mother" },
    { id: "g4-4", name: "Ibn Samhan", role: "Father" },
    { id: "g4-5", name: "Bint Sabah", role: "Mother" },
    { id: "g4-6", name: "Ibn Rabdan", role: "Father" },
    { id: "g4-7", name: "Saklaviyah Shaifiya", role: "Mother" },
    { id: "g4-8", name: "Saklawi Sheifi", role: "Father" },
    { id: "g4-9", name: "Bint Hadba Al Saghira", role: "Mother" },
    { id: "g4-10", name: "Samhan", role: "Father" },
    { id: "g4-11", name: "Kasima", role: "Mother" },
    { id: "g4-12", name: "Sottam I", role: "Father" },
    { id: "g4-13", name: "Nafieah Al Kabierah", role: "Mother" },
    { id: "g4-14", name: "Maanegi Sbeyli", role: "Father" },
    { id: "g4-15", name: "Dalal Al Zarka", role: "Mother" },
    { id: "g4-16", name: "Saklawi I", role: "Father" },
  ],
  [
    { id: "g5-1", name: "Dalal El Hamra", role: "Mother" },
    { id: "g5-2", name: "Saadun", role: "Father" },
    { id: "g5-3", name: "Kasima", role: "Mother" },
    { id: "g5-4", name: "Sottam I", role: "Father" },
    { id: "g5-5", name: "Nadra El Saghira", role: "Mother" },
    { id: "g5-6", name: "Saklawi II", role: "Father" },
    { id: "g5-7", name: "Nafaa El Saghira", role: "Mother" },
    { id: "g5-8", name: "Samhan", role: "Father" },
    { id: "g5-9", name: "Sabah", role: "Mother" },
    { id: "g5-10", name: "Kazmeen", role: "Father" },
    { id: "g5-11", name: "Bint Gamila", role: "Mother" },
    { id: "g5-12", name: "Rabdan El Azrak", role: "Father" },
    { id: "g5-13", name: "Mom N/A", role: "Mother" },
    { id: "g5-14", name: "Dad N/A", role: "Father" },
    { id: "g5-15", name: "Mom N/A", role: "Mother" },
    { id: "g5-16", name: "Dad N/A", role: "Father" },
    { id: "g5-17", name: "Hadbah", role: "Mother" },
    { id: "g5-18", name: "El Halabi", role: "Father" },
    { id: "g5-19", name: "Om Dalal", role: "Mother" },
    { id: "g5-20", name: "Rabdan El Azrak", role: "Father" },
    { id: "g5-21", name: "Kasida", role: "Mother" },
    { id: "g5-22", name: "Narkisa", role: "Father" },
    { id: "g5-23", name: "Selma II", role: "Mother" },
    { id: "g5-24", name: "Astraled", role: "Father" },
    { id: "g5-25", name: "Donia", role: "Mother" },
    { id: "g5-26", name: "Rabdan El Azrak", role: "Father" },
    { id: "g5-27", name: "Mom N/A", role: "Mother" },
    { id: "g5-28", name: "Dad N/A", role: "Father" },
    { id: "g5-29", name: "Om Dalal", role: "Mother" },
    { id: "g5-30", name: "Rabdan El Azrak", role: "Father" },
    { id: "g5-31", name: "Al Dahma", role: "Mother" },
    { id: "g5-32", name: "Saklawi I", role: "Father" },
  ],
];

const MAX_LEAF_COUNT = Math.max(
  ...pedigreeMockData.map((column) => column.length),
);

const getTopPercent = (count: number, index: number) => {
  const span = MAX_LEAF_COUNT / count;
  const center = index * span + span / 2;
  return (center / MAX_LEAF_COUNT) * 100;
};

const labelForNode = (node: PedigreeNode) => `${node.name} (${node.role})`;

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
      <div className="flex h-full w-full items-center justify-center rounded-[8px] border border-dashed border-[#bbb3aa] bg-[#f7f3ee]/80 px-2 text-center font-serif text-[8px] leading-none text-[#2c3953] shadow-[0_1px_0_rgba(0,0,0,0.02)] sm:text-[8.5px] md:text-[9px] lg:text-[9.5px] xl:text-[10px]">
        <span className="block w-full truncate whitespace-nowrap">
          {labelForNode(node)}
        </span>
      </div>
    </div>
  );
};

export const HorsePedigreeTree: FC<HorsePedigreeTreeProps> = ({
  horse,
  showTitle = true,
  controlsVariant = "default",
}) => {
  const { direction } = useLocale();
  const isRTL = direction === "rtl";
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const orderedColumns = useMemo(() => {
    return isRTL ? [...pedigreeMockData].reverse() : pedigreeMockData;
  }, [isRTL]);

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
            disabled={isDownloading}
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
            className={`inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap bg-white font-semibold text-[#3e3640] transition hover:bg-[#f8f3ed] ${
              controlsVariant === "compact"
                ? "h-11 w-11 rounded-xl border border-[#e6ddd4]"
                : "h-11 rounded-2xl px-4 text-sm"
            }`}
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
                  ? "980px"
                  : isFullscreen
                    ? `min(96vw, calc((100dvh - 72px) * ${CERTIFICATE_ASPECT}))`
                    : "100%",
              minWidth: isFullscreen && !isMobileViewport ? undefined : "980px",
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
                className="h-auto w-[34%] max-w-[420px] object-contain"
              />
            </div>

            <div className="relative z-10 h-full px-5 pb-8 pt-8 sm:px-7 sm:pb-10 sm:pt-10 lg:px-8 lg:pb-12 lg:pt-12 xl:px-10">
              <div
                className="grid h-full w-full gap-x-3 md:gap-x-4 lg:gap-x-5"
                style={{
                  gridTemplateColumns: isRTL
                    ? "1.2fr 1.05fr 1fr 0.95fr 1.1fr"
                    : "1.1fr 0.95fr 1fr 1.05fr 1.2fr",
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
                        top={getTopPercent(column.length, nodeIndex)}
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
    </div>
  );
};
