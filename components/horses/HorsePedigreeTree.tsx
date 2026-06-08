"use client";

import { FC, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useLocale } from "@/lib/locale-context";
import { X } from "lucide-react";
import {
  getExternalHorseSummary,
  getHorsePedigree,
} from "@/lib/api/external-horses";
import {
  getLocalizedName,
  localizeColor,
  localizeCountry,
} from "@/lib/api/localization";
import {
  DEFAULT_HORSE_IMAGE,
  formatDate,
  mediaUrl,
  localizeGender,
} from "@/lib/api/horse-formatters";
import type { ExternalHorseSummaryItem } from "@/lib/api/types";

interface Horse {
  id?: string;
  localId?: number | string | null;
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
  studbookId: number | null;
  name: string;
  role: ParentRole;
  englishName?: string | null;
  arabicName?: string | null;
  gender?: string | null;
  dateofBirth?: string | null;
  fatherName?: string;
  motherName?: string;
  isStrain?: boolean | null;
  isSpecial?: boolean | null;
  duplicateColor?: { background: string; border: string };
};

type TopMetaItem = {
  label: string;
  value: string;
};

const NODE_HEIGHT_PX = 32;
const CERTIFICATE_ASPECT = 1600 / 1200;
const MIN_COLUMN_WIDTH_PX = 220;

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

    if (Array.isArray(record.data)) {
      return record.data.filter(Array.isArray) as unknown[][];
    }

    if (Array.isArray(record.levels)) {
      return record.levels.filter(Array.isArray) as unknown[][];
    }
  }

  return [];
};

const ParentIcon = ({ role }: { role: ParentRole }) => {
  if (role === "Root") return null;

  return null;
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
      colors.set(
        id,
        DUPLICATE_ANCESTOR_COLORS[colorIndex % DUPLICATE_ANCESTOR_COLORS.length],
      );
      colorIndex += 1;
    }
  });

  return colors;
}

const mapPedigreeLevels = (
  levels: unknown[][],
  isRTL: boolean,
): PedigreeNode[][] => {
  const mapped = levels
    .map((generation, generationIndex) =>
      generation.map((nodeValue, nodeIndex) => {
        const node =
          nodeValue && typeof nodeValue === "object"
            ? (nodeValue as Record<string, unknown>)
            : {};

        return {
          id: String(node.id ?? `${generationIndex}-${nodeIndex}`),
          studbookId:
            typeof node.id === "number" ? node.id : Number(node.id) || null,
          englishName:
            typeof node.englishName === "string" ? node.englishName : null,
          arabicName:
            typeof node.arabicName === "string" ? node.arabicName : null,
          name: getLocalizedName(
            typeof node.englishName === "string" ? node.englishName : null,
            typeof node.arabicName === "string" ? node.arabicName : null,
            isRTL,
          ),
          gender: typeof node.gender === "string" ? node.gender : null,
          dateofBirth:
            typeof node.dateofBirth === "string" ? node.dateofBirth : null,
          fatherName: getLocalizedName(
            typeof node.horseFatherEnglishName === "string"
              ? node.horseFatherEnglishName
              : null,
            typeof node.horseFatherArabicName === "string"
              ? node.horseFatherArabicName
              : null,
            isRTL,
          ),
          motherName: getLocalizedName(
            typeof node.horseMotherEnglishName === "string"
              ? node.horseMotherEnglishName
              : null,
            typeof node.horseMotherArabicName === "string"
              ? node.horseMotherArabicName
              : null,
            isRTL,
          ),
          isStrain: typeof node.isStrain === "boolean" ? node.isStrain : null,
          isSpecial:
            typeof node.isSpecial === "boolean" ? node.isSpecial : null,
          role: (
            generationIndex === 0
              ? "Root"
              : nodeIndex % 2 === 0
                ? "Father"
                : "Mother"
          ) as ParentRole,
        };
      }),
    )
    .filter((column) => column.length);

  const duplicateColors = getDuplicateColorMap(mapped);

  return mapped.map((column) =>
    column.map((node) => ({
      ...node,
      duplicateColor: duplicateColors.get(node.id),
    })),
  );
};

const normalizeSummaryPayload = (
  payload: unknown,
): ExternalHorseSummaryItem | null => {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.data)) {
    return (record.data[0] as ExternalHorseSummaryItem | undefined) ?? null;
  }

  return payload as ExternalHorseSummaryItem;
};

const studName = (
  value: ExternalHorseSummaryItem["studOwner"] | ExternalHorseSummaryItem["studBreeder"],
) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.studName ?? value.studArabicName ?? "";
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

const getNestedName = (value: unknown, isRTL: boolean) => {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (typeof value === "object") {
    const row = value as Record<string, unknown>;
    const ar = typeof row.studArabicName === "string" ? row.studArabicName : "";
    const en = typeof row.studName === "string" ? row.studName : "";
    return isRTL ? ar || en : en || ar;
  }

  return "";
};

const formatTopBirthDate = (value: unknown, isRTL: boolean) => {
  if (typeof value !== "string" || !value) return "-";

  try {
    return new Intl.DateTimeFormat(isRTL ? "ar-EG" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const getTopMetaItems = (horse: Horse, isRTL: boolean): TopMetaItem[] => {
  const raw = (horse as Horse & { raw?: Record<string, unknown> }).raw;

  if (!raw) return [];

  const locale = isRTL ? "ar" : "en";
  const strain =
    (isRTL
      ? raw.strainAr ?? raw.lineAr ?? raw.strainEn ?? raw.lineEn
      : raw.strainEn ?? raw.lineEn ?? raw.strainAr ?? raw.lineAr) ?? "";
  const line =
    (isRTL
      ? raw.lineAr ?? raw.specialLineAr ?? raw.specialAr ?? raw.lineEn
      : raw.lineEn ?? raw.specialLineEn ?? raw.specialEn ?? raw.lineAr) ?? "";
  const gender = localizeGender(
    typeof raw.gender === "string" ? raw.gender : "",
    locale,
  );
  const birth = formatTopBirthDate(raw.dateofBirth, isRTL);
  const breeder = getNestedName(raw.breeder, isRTL);
  const owner = getNestedName(raw.owner, isRTL);
  const microchip =
    raw.microchipID ?? raw.microchip ?? raw.microchipId ?? raw.chipNumber ?? "";

  return [
    {
      label: isRTL ? "الرسن" : "Strain",
      value: String(strain || "-"),
    },
    {
      label: isRTL ? "الجنس" : "Gender",
      value: String(gender || "-"),
    },
    {
      label: isRTL ? "تاريخ الميلاد" : "Birth Date",
      value: birth,
    },
    {
      label: isRTL ? "المربي" : "Breeder",
      value: String(breeder || "-"),
    },
    {
      label: isRTL ? "المالك" : "Owner",
      value: String(owner || "-"),
    },
    {
      label: isRTL ? "الرقاقة" : "Microchip",
      value: String(microchip || "-"),
    },
    {
      label: isRTL ? "الخط" : "Line",
      value: String(line || "-"),
    },
  ];
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

const TopMetaRow = ({
  items,
  isRTL,
}: {
  items: TopMetaItem[];
  isRTL: boolean;
}) => {
  if (!items.length) return null;

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="pointer-events-none flex w-full justify-center px-2 pb-4 pt-1 font-serif text-[#2c3953]"
    >
   <div className="flex max-w-full flex-nowrap items-center justify-center gap-0 overflow-hidden whitespace-nowrap text-[12px] leading-none sm:text-[13px] md:text-[14px] lg:text-[16px] xl:text-[18px]">
  {items.map((item, index) => (
    <div
      key={`${item.label}-${index}`}
      className="flex min-w-0 shrink items-center"
    >
      <span className="shrink-0 font-semibold text-[#566178]">
        {item.label} :
      </span>

      <span className="min-w-0 truncate px-1.5 font-extrabold text-[#111827]">
        {item.value}
      </span>

      {index < items.length - 1 ? (
        <span className="mx-2 h-4 w-px shrink-0 bg-[#cdd5e1]" />
      ) : null}
    </div>
  ))}
</div>
    </div>
  );
};

const PedigreeBox = ({
  node,
  top,
  onClick,
  highlighted,
  onDuplicateHover,
}: {
  node: PedigreeNode;
  top: number;
  onClick: (node: PedigreeNode) => void;
  highlighted: boolean;
  onDuplicateHover: (id: string | null) => void;
}) => {
  return (
    <div
      dir="ltr"
      className="absolute left-0 right-0 px-[2px]"
      style={{
        top: `calc(${top}% - ${NODE_HEIGHT_PX / 2}px)`,
        height: `${NODE_HEIGHT_PX}px`,
      }}
    >
      <button
        type="button"
        onClick={() => onClick(node)}
        onMouseEnter={() => node.duplicateColor && onDuplicateHover(node.id)}
        onMouseLeave={() => node.duplicateColor && onDuplicateHover(null)}
        onFocus={() => node.duplicateColor && onDuplicateHover(node.id)}
        onBlur={() => node.duplicateColor && onDuplicateHover(null)}
        className="relative flex h-full w-full items-center justify-center gap-1 rounded-[8px] border border-dashed border-[#bbb3aa] bg-[#f7f3ee]/80 px-2 text-center font-serif text-[13px] leading-none text-[#2c3953] shadow-[0_1px_0_rgba(0,0,0,0.02)] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#4a2b1a]/30 sm:text-[12px] md:text-[13px] lg:text-[14px] xl:text-[15px]"
        style={
          node.duplicateColor
            ? {
                backgroundColor: node.duplicateColor.background,
                borderColor: node.duplicateColor.border,
                borderWidth: highlighted ? "3px" : "1px",
                boxShadow: highlighted
                  ? `0 0 0 3px ${node.duplicateColor.border}35, 0 5px 14px rgba(0,0,0,0.16)`
                  : undefined,
                transform: highlighted ? "scale(1.04)" : undefined,
                zIndex: highlighted ? 10 : undefined,
                direction: "ltr",
                unicodeBidi: "isolate",
              }
            : {
                direction: "ltr",
                unicodeBidi: "isolate",
              }
        }
      >
        <ParentIcon role={node.role} />
        <span className="block min-w-0 truncate whitespace-nowrap">
          {node.name}
        </span>
      </button>
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
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);

  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [apiColumns, setApiColumns] = useState<PedigreeNode[][]>([]);
  const horseLocalId = horse.localId ?? horse.id;
  const numericLocalId =
    typeof horseLocalId === "number" ? horseLocalId : Number(horseLocalId);
  const hasLocalId = Number.isFinite(numericLocalId) && numericLocalId > 0;
  const [isTreeLoading, setIsTreeLoading] = useState(hasLocalId || loading);
  const [treeError, setTreeError] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryNode, setSummaryNode] = useState<PedigreeNode | null>(null);
  const [summaryHorse, setSummaryHorse] =
    useState<ExternalHorseSummaryItem | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [hoveredDuplicateId, setHoveredDuplicateId] = useState<string | null>(
    null,
  );

  const orderedColumns = useMemo(() => [...apiColumns].reverse(), [apiColumns]);
  const topMetaItems = useMemo(() => getTopMetaItems(horse, isRTL), [horse, isRTL]);
  const maxLeafCount = useMemo(
    () => Math.max(1, ...apiColumns.map((column) => column.length)),
    [apiColumns],
  );
  const hasPedigree = apiColumns.length > 0;
  const certificateMinWidth = Math.max(
    1550,
    apiColumns.length * MIN_COLUMN_WIDTH_PX,
  );
  const certificateScrollableHeight = Math.max(
    900,
    Math.round(certificateMinWidth / CERTIFICATE_ASPECT),
  );
  const shouldUseScrollableCanvas = isNarrowViewport || isMobileViewport;

  useEffect(() => {
    if (pedigreeData !== undefined) {
      setTreeError("");
      setIsTreeLoading(loading);

      if (!loading) {
        setApiColumns(
          mapPedigreeLevels(normalizePedigreeLevels(pedigreeData), isRTL),
        );
      }

      return;
    }

    if (!hasLocalId) {
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
        const result = await getHorsePedigree({
          localId: numericLocalId,
          levels: 6,
        });
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
  }, [hasLocalId, numericLocalId, isRTL, pedigreeData, loading]);

  useEffect(() => {
    const mobileMedia = window.matchMedia("(max-width: 767px)");
    const narrowMedia = window.matchMedia("(max-width: 1549px)");

    const apply = () => {
      setIsMobileViewport(mobileMedia.matches);
      setIsNarrowViewport(narrowMedia.matches);
    };

    apply();

    mobileMedia.addEventListener("change", apply);
    narrowMedia.addEventListener("change", apply);

    return () => {
      mobileMedia.removeEventListener("change", apply);
      narrowMedia.removeEventListener("change", apply);
    };
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

  useEffect(() => {
    if (!hasPedigree) return;

    const frame = window.requestAnimationFrame(() => {
      if (scrollerRef.current) {
        scrollerRef.current.scrollLeft = 0;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hasPedigree, orderedColumns.length, isFullscreen]);

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

  const handleNodeClick = async (node: PedigreeNode) => {
    setSummaryNode(node);
    setSummaryOpen(true);
    setSummaryHorse(null);
    setSummaryError("");

    if (!node.studbookId) {
      setSummaryError(
        isRTL
          ? "لا يوجد رقم Studbook لهذا الخيل."
          : "No studbook id is available for this horse.",
      );
      return;
    }

    try {
      setSummaryLoading(true);
      const result = await getExternalHorseSummary(node.studbookId);
      setSummaryHorse(normalizeSummaryPayload(result.data));
    } catch (requestError) {
      setSummaryError(
        requestError instanceof Error
          ? requestError.message
          : isRTL
            ? "تعذر تحميل بيانات الخيل."
            : "Failed to load horse summary.",
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const summaryName = summaryHorse
    ? getLocalizedName(summaryHorse.englishName, summaryHorse.arabicName, isRTL)
    : summaryNode?.name ?? "";
  const summaryFather = summaryHorse
    ? getLocalizedName(
        summaryHorse.horseFatherEnglishName,
        summaryHorse.horseFatherArabicName,
        isRTL,
      )
    : summaryNode?.fatherName ?? "";
  const summaryMother = summaryHorse
    ? getLocalizedName(
        summaryHorse.horseMotherEnglishName,
        summaryHorse.horseMotherArabicName,
        isRTL,
      )
    : summaryNode?.motherName ?? "";
  const summaryImage = summaryHorse
    ? summaryHorse.horseProfileImage ||
      mediaUrl(summaryHorse.images?.[0]) ||
      DEFAULT_HORSE_IMAGE
    : DEFAULT_HORSE_IMAGE;
  const summaryKnownAs = summaryHorse?.knownAs?.trim();
  const summaryBornIn = summaryHorse?.bornIn
    ? localizeCountry(summaryHorse.bornIn, isRTL ? "ar" : "en")
    : "-";
  const summaryCurrentlyIn = summaryHorse?.currentlyIn
    ? localizeCountry(summaryHorse.currentlyIn, isRTL ? "ar" : "en")
    : "-";
  const summaryColor = summaryHorse?.color
    ? localizeColor(summaryHorse.color, isRTL ? "ar" : "en")
    : "-";
  const summaryOwner = studName(summaryHorse?.studOwner);
  const summaryBreeder = studName(summaryHorse?.studBreeder);

  return (
    <div className="mx-auto mb-8 w-full max-w-none">
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
            className={`inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap bg-white font-semibold text-[#3e3640] transition hover:bg-[#f8f3ed] disabled:cursor-not-allowed disabled:opacity-50 ${
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

      {treeError ? (
        <div className="mb-4 rounded-2xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444]">
          {treeError}
        </div>
      ) : null}

      {isTreeLoading ? (
        <div
          className="rounded-[26px] bg-[#efeae5] p-3"
          dir="ltr"
          style={{ direction: "ltr" }}
        >
          <div
            className="relative aspect-[1600/1200] w-full overflow-hidden rounded-[20px] bg-[#f7f3ee] shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
            dir="ltr"
            style={{ direction: "ltr" }}
          >
            <div
              className="grid h-full grid-cols-5 gap-x-4 px-8 py-10"
              dir="ltr"
              style={{ direction: "ltr" }}
            >
              {[4, 3, 2, 1, 0].map((columnIndex) => (
                <div
                  key={columnIndex}
                  className="flex flex-col justify-around"
                >
                  {Array.from({
                    length: 2 ** Math.min(columnIndex + 1, 5),
                  }).map((__, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="flex h-[28px] items-center gap-1 rounded-[8px] bg-[#ded6cf] px-1.5"
                    >
                      {columnIndex > 0 ? (
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-[#cfc6be]" />
                      ) : null}
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
          {hasLocalId
            ? isRTL
              ? "لا توجد بيانات نسب متاحة لهذا الخيل."
              : "No pedigree data is available for this horse."
            : isRTL
              ? "لا يوجد رقم محلي لهذا الخيل لعرض شهادة النسب."
              : "No local id is available for this horse pedigree."}
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
          {isFullscreen && isMobileViewport ? (
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
          ) : null}

          <div
            dir="ltr"
            ref={scrollerRef}
            className={`w-full rounded-[22px] ${
              isFullscreen && !shouldUseScrollableCanvas
                ? "flex items-center justify-center overflow-hidden"
                : ""
            } ${
              isFullscreen && shouldUseScrollableCanvas
                ? "h-full overflow-auto"
                : shouldUseScrollableCanvas
                  ? "overflow-x-auto"
                  : "overflow-x-auto"
            }`}
            style={{
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: isFullscreen ? "contain" : "auto",
              touchAction:
                isFullscreen && shouldUseScrollableCanvas
                  ? "pan-x pan-y pinch-zoom"
                  : "auto",
              maxHeight: undefined,
            }}
          >
            <div
              ref={exportRef}
              className="relative overflow-hidden rounded-[20px] bg-[#f7f3ee] shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
              style={{
                aspectRatio: `${CERTIFICATE_ASPECT}`,
                width: shouldUseScrollableCanvas
                  ? `${certificateMinWidth}px`
                  : isFullscreen
                    ? `min(96vw, calc((100dvh - 72px) * ${CERTIFICATE_ASPECT}))`
                    : "100%",
                minWidth: shouldUseScrollableCanvas
                  ? `${certificateMinWidth}px`
                  : undefined,
                height: shouldUseScrollableCanvas
                  ? `${certificateScrollableHeight}px`
                  : undefined,
                maxWidth:
                  shouldUseScrollableCanvas || isFullscreen ? undefined : "100%",
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

              <div className="relative z-10 flex h-full flex-col px-5 pb-8 pt-8 sm:px-7 sm:pb-10 sm:pt-10 lg:px-8 lg:pb-12 lg:pt-12 xl:px-10">
                <TopMetaRow items={topMetaItems} isRTL={isRTL} />

                <div
                  dir="ltr"
                  className="relative min-h-0 flex-1"
                  style={{ direction: "ltr" }}
                >
                  {orderedColumns.map((column, columnIndex) => {
                    const columnCount = Math.max(1, orderedColumns.length);
                    const gapPx = 10;
                    const columnWidth = `calc((100% - ${
                      (columnCount - 1) * gapPx
                    }px) / ${columnCount})`;

                    return (
                      <div
                        key={`column-${columnIndex}`}
                        className="absolute top-0 h-full"
                        style={{
                          left: `calc(${
                            (columnIndex / columnCount) * 100
                          }% + ${
                            columnIndex === 0 ? 0 : columnIndex * gapPx
                          }px - ${
                            columnIndex === 0
                              ? 0
                              : (columnIndex / columnCount) *
                                (columnCount - 1) *
                                gapPx
                          }px)`,
                          width: columnWidth,
                        }}
                      >
                        {column.map((node, nodeIndex) => (
                          <PedigreeBox
                            key={`${columnIndex}-${nodeIndex}-${node.id}`}
                            node={node}
                            top={getTopPercent(
                              column.length,
                              nodeIndex,
                              maxLeafCount,
                            )}
                            onClick={handleNodeClick}
                            highlighted={Boolean(
                              node.duplicateColor &&
                                hoveredDuplicateId === node.id,
                            )}
                            onDuplicateHover={setHoveredDuplicateId}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className={`pointer-events-none absolute bottom-8 z-20 h-8 w-24 sm:bottom-5 sm:h-9 sm:w-28 md:h-10 md:w-32 ${
                  isRTL ? "right-7 sm:right-10" : "left-7 sm:left-5"
                }`}
              >
                <img
                  src="/horse/studbooklogo.png"
                  alt="Studbook Logo"
                  className={`h-full w-full object-contain ${
                    isRTL ? "object-right" : "object-left"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {summaryOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSummaryOpen(false);
          }}
        >
          <div
            dir={direction}
            className="w-full max-w-lg rounded-[24px] bg-white p-5 shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <img
                  src={summaryImage}
                  alt={summaryName || (isRTL ? "صورة الخيل" : "Horse image")}
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                />

                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-[#2b1a12]">
                    {summaryName || (isRTL ? "بيانات الخيل" : "Horse details")}
                  </h3>

                  {summaryKnownAs ? (
                    <p className="mt-0.5 text-sm font-semibold text-[#4f4037]">
                      {summaryKnownAs}
                    </p>
                  ) : null}

                  <p className="mt-1 text-xs font-semibold text-[#7a6c63]">
                    {summaryNode?.studbookId
                      ? `Studbook ID: ${summaryNode.studbookId}`
                      : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f7f1eb] text-[#3b2b20]"
                aria-label={isRTL ? "إغلاق" : "Close"}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {summaryLoading ? (
              <div className="rounded-2xl bg-[#fbf8f4] px-4 py-8 text-center text-sm text-[#7a6c63]">
                {isRTL ? "جارٍ التحميل..." : "Loading..."}
              </div>
            ) : summaryError ? (
              <div className="rounded-2xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444]">
                {summaryError}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 text-sm text-[#3b2b20] sm:grid-cols-2">
                <div className="rounded-2xl bg-[#fbf8f4] p-3">
                  <span className="block text-xs font-semibold text-[#7a6c63]">
                    {isRTL ? "النوع" : "Gender"}
                  </span>
                  <span className="mt-1 block font-bold">
                    {summaryHorse?.gender ?? summaryNode?.gender ?? "-"}
                  </span>
                </div>

                <div className="rounded-2xl bg-[#fbf8f4] p-3">
                  <span className="block text-xs font-semibold text-[#7a6c63]">
                    {isRTL ? "تاريخ الميلاد" : "Date of birth"}
                  </span>
                  <span className="mt-1 block font-bold">
                    {formatDate(
                      summaryHorse?.dateofBirth ?? summaryNode?.dateofBirth,
                    )}
                  </span>
                </div>

                <div className="rounded-2xl bg-[#fbf8f4] p-3">
                  <span className="block text-xs font-semibold text-[#7a6c63]">
                    {isRTL ? "اللون" : "Color"}
                  </span>
                  <span className="mt-1 block font-bold">{summaryColor}</span>
                </div>

                <div className="rounded-2xl bg-[#fbf8f4] p-3">
                  <span className="block text-xs font-semibold text-[#7a6c63]">
                    {isRTL ? "ولد في" : "Born in"}
                  </span>
                  <span className="mt-1 block font-bold">{summaryBornIn}</span>
                </div>

                <div className="rounded-2xl bg-[#fbf8f4] p-3">
                  <span className="block text-xs font-semibold text-[#7a6c63]">
                    {isRTL ? "الأب" : "Father"}
                  </span>
                  <span className="mt-1 block font-bold">
                    {summaryFather && summaryFather !== "-" ? summaryFather : "-"}
                  </span>
                </div>

                <div className="rounded-2xl bg-[#fbf8f4] p-3">
                  <span className="block text-xs font-semibold text-[#7a6c63]">
                    {isRTL ? "الأم" : "Mother"}
                  </span>
                  <span className="mt-1 block font-bold">
                    {summaryMother && summaryMother !== "-" ? summaryMother : "-"}
                  </span>
                </div>

                <div className="rounded-2xl bg-[#fbf8f4] p-3">
                  <span className="block text-xs font-semibold text-[#7a6c63]">
                    {isRTL ? "حالياً في" : "Currently in"}
                  </span>
                  <span className="mt-1 block font-bold">
                    {summaryCurrentlyIn}
                  </span>
                </div>

                <div className="rounded-2xl bg-[#fbf8f4] p-3">
                  <span className="block text-xs font-semibold text-[#7a6c63]">
                    {isRTL ? "مستوى الجيل" : "Generation"}
                  </span>
                  <span className="mt-1 block font-bold">
                    {summaryHorse?.generationLevel ?? "-"}
                  </span>
                </div>

                <div className="rounded-2xl bg-[#fbf8f4] p-3">
                  <span className="block text-xs font-semibold text-[#7a6c63]">
                    {isRTL ? "المالك" : "Owner"}
                  </span>
                  <span className="mt-1 block font-bold">
                    {summaryOwner || "-"}
                  </span>
                </div>

                <div className="rounded-2xl bg-[#fbf8f4] p-3">
                  <span className="block text-xs font-semibold text-[#7a6c63]">
                    {isRTL ? "المربي" : "Breeder"}
                  </span>
                  <span className="mt-1 block font-bold">
                    {summaryBreeder || "-"}
                  </span>
                </div>

                <div className="rounded-2xl bg-[#fbf8f4] p-3">
                  <span className="block text-xs font-semibold text-[#7a6c63]">
                    {isRTL ? "العلامات" : "Flags"}
                  </span>
                  <span className="mt-1 block font-bold">
                    {[
                      summaryHorse?.isStrain || summaryNode?.isStrain
                        ? isRTL
                          ? "سلالة"
                          : "Strain"
                        : null,
                      summaryHorse?.isSpecial || summaryNode?.isSpecial
                        ? isRTL
                          ? "خاص"
                          : "Special"
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" / ") || "-"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};