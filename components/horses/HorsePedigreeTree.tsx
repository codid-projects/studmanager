"use client";

import { FC, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import { useLocale } from "@/lib/locale-context";
import { GitBranch, Pencil, Plus, Save, Tag, Trash2, X } from "lucide-react";
import { clientApiFetch } from "@/lib/api/client";
import {
  getExternalHorseSummary,
  getHorsePedigree,
  getHorsePedigreeBranch,
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
import type {
  ApiResult,
  ExternalHorseSummaryItem,
  HorseTagDto,
  LocaleCode,
} from "@/lib/api/types";

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
  onTagsMutated?: () => void;
}

type ParentRole = "Root" | "Mother" | "Father";

type PedigreeNode = {
  id: string;
  localId: number | null;
  studbookId: number | null;
  name: string;
  role: ParentRole;
  generationIndex: number;
  nodeIndex: number;
  englishName?: string | null;
  arabicName?: string | null;
  gender?: string | null;
  dateofBirth?: string | null;
  fatherId?: number | null;
  fatherEnglishName?: string | null;
  fatherArabicName?: string | null;
  fatherName?: string;
  motherId?: number | null;
  motherEnglishName?: string | null;
  motherArabicName?: string | null;
  motherName?: string;
  isStrain?: boolean | null;
  isSpecial?: boolean | null;
  tags?: HorseTagDto[];
  duplicateColor?: { background: string; border: string };
};

type TopMetaItem = {
  label: string;
  value: string;
};

type BranchExpansion = {
  nodeKey: string;
  horseId: number;
  title: string;
  rootNode: PedigreeNode;
  columns: PedigreeNode[][];
  requestedLevels: number;
  maxAdditionalLevels: number;
  endReached: boolean;
};

const CERTIFICATE_ASPECT = 1600 / 1340;
const MIN_COLUMN_WIDTH_PX = 205;
const CERTIFICATE_BASE_WIDTH_PX = 1320;
const INITIAL_PEDIGREE_LEVELS = 6;
const MAX_PEDIGREE_LEVELS = 12;
const PEDIGREE_LEVEL_STEP = 3;

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

const getTopPercent = (
  count: number,
  index: number,
  maxLeafCount: number,
  edgeInsetPercent = 0,
) => {
  const span = maxLeafCount / count;
  const center = index * span + span / 2;
  const percent = (center / maxLeafCount) * 100;
  return edgeInsetPercent + (percent / 100) * (100 - edgeInsetPercent * 2);
};

const ARABIC_DIACRITICS = ["َ", "ُ", "ْ", "ِ", "ّ"];
const ARABIC_LETTER_PATTERN = /[\u0621-\u064A]/;
const ARABIC_DIACRITIC_PATTERN = /[\u064B-\u065F]/;

const decorateArabicName = (value: string, seed: string) => {
  if (!value || ARABIC_DIACRITIC_PATTERN.test(value)) return value;

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 997;
  }

  let letterIndex = 0;

  return Array.from(value)
    .map((char) => {
      if (!ARABIC_LETTER_PATTERN.test(char)) return char;

      letterIndex += 1;

      if ((letterIndex + hash) % 3 !== 0) return char;

      return `${char}${ARABIC_DIACRITICS[(letterIndex + hash) % ARABIC_DIACRITICS.length]}`;
    })
    .join("");
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
          localId:
            typeof node.localId === "number"
              ? node.localId
              : Number(node.localId) || null,
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
          fatherId:
            typeof node.horseFatherId === "number"
              ? node.horseFatherId
              : Number(node.horseFatherId) || null,
          fatherEnglishName:
            typeof node.horseFatherEnglishName === "string"
              ? node.horseFatherEnglishName
              : null,
          fatherArabicName:
            typeof node.horseFatherArabicName === "string"
              ? node.horseFatherArabicName
              : null,
          fatherName: getLocalizedName(
            typeof node.horseFatherEnglishName === "string"
              ? node.horseFatherEnglishName
              : null,
            typeof node.horseFatherArabicName === "string"
              ? node.horseFatherArabicName
              : null,
            isRTL,
          ),
          motherId:
            typeof node.horseMotherId === "number"
              ? node.horseMotherId
              : Number(node.horseMotherId) || null,
          motherEnglishName:
            typeof node.horseMotherEnglishName === "string"
              ? node.horseMotherEnglishName
              : null,
          motherArabicName:
            typeof node.horseMotherArabicName === "string"
              ? node.horseMotherArabicName
              : null,
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
          tags: Array.isArray(node.tags) ? (node.tags as HorseTagDto[]) : [],
          role: (
            generationIndex === 0
              ? "Root"
              : nodeIndex % 2 === 0
                ? "Father"
                : "Mother"
          ) as ParentRole,
          generationIndex,
          nodeIndex,
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
  const gender = localizeGender(
    typeof raw.gender === "string" ? raw.gender : "",
    locale,
  );
  const birth = formatTopBirthDate(raw.dateofBirth, isRTL);
  const pickText = (en: unknown, ar: unknown) => {
    const e = typeof en === "string" ? en : "";
    const a = typeof ar === "string" ? ar : "";
    return isRTL ? a || e : e || a;
  };
  const breeder =
    getNestedName(raw.breeder, isRTL) || pickText(raw.breederEn, raw.breederAr);
  const owner =
    getNestedName(raw.owner, isRTL) || pickText(raw.ownerEn, raw.ownerAr);
  if (isRTL) {
    return [
      {
        label: "النوع",
        value: String(gender || "-"),
      },
      {
        label: "تاريخ الميلاد",
        value: birth,
      },
      {
        label: "الرسن",
        value: String(strain || "-"),
      },
      {
        label: "المنتج",
        value: String(breeder || "-"),
      },
      {
        label: "المربي",
        value: String(owner || "-"),
      },
    ];
  }

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
      className="pointer-events-none w-full px-8 pb-5 pt-5 text-[#159456]"
      style={{
        fontFamily: isRTL
          ? "'Diwani Letter', 'SF Pro AR', serif"
          : "'SF Pro AR', serif",
      }}
    >
      <div className="flex max-w-full flex-nowrap items-center justify-between gap-4 overflow-hidden whitespace-nowrap text-[18px] md:text-[24px] xl:text-[30px]">
        {items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="flex min-w-0 shrink items-baseline gap-2"
          >
            <span className="shrink-0">{item.label} :</span>

            <span className="min-w-0 truncate">{item.value}</span>
          </div>
        ))}
      </div>
      <div className="mx-7 mt-3 h-[3px] rounded-full bg-[#159456]" />
    </div>
  );
};

const CertificateBorder = () => (
  <>
    <img
      src="/horse/pedigree-certificate-border.png"
      alt="Border Frame"
      className="pointer-events-none absolute inset-0 z-[2] h-full w-full object-fill"
    />
  </>
);

const PedigreeConnectors = ({
  columns,
  maxLeafCount,
}: {
  columns: PedigreeNode[][];
  maxLeafCount: number;
}) => {
  const columnCount = Math.max(1, columns.length);

  if (columnCount < 2) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[4] h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {columns.slice(0, -1).flatMap((column, columnIndex) => {
        const nextColumn = columns[columnIndex + 1] ?? [];
        if (!column.length || !nextColumn.length) return [];

        const xChild = ((columnIndex + 0.77) / columnCount) * 100;
        const xParent = ((columnIndex + 1.23) / columnCount) * 100;
        const ratio = column.length / nextColumn.length;

        return nextColumn.map((_, parentIndex) => {
          const firstChildIndex = Math.min(
            column.length - 1,
            Math.floor(parentIndex * ratio),
          );
          const secondChildIndex = Math.min(
            column.length - 1,
            Math.max(firstChildIndex, Math.floor((parentIndex + 1) * ratio) - 1),
          );
          const yA = getTopPercent(column.length, firstChildIndex, maxLeafCount, 4);
          const yB = getTopPercent(column.length, secondChildIndex, maxLeafCount, 4);
          const yParent = getTopPercent(
            nextColumn.length,
            parentIndex,
            maxLeafCount,
            4,
          );
          const yMid = (yA + yB) / 2;

          return (
            <g key={`connector-${columnIndex}-${parentIndex}`}>
              {firstChildIndex !== secondChildIndex ? (
                <line
                  x1={xChild}
                  y1={yA}
                  x2={xChild}
                  y2={yB}
                  stroke="#1a7350"
                  strokeWidth="0.22"
                  strokeLinecap="round"
                  opacity="0.62"
                />
              ) : null}
              <path
                d={`M ${xChild} ${yMid} H ${(xChild + xParent) / 2} V ${yParent} H ${xParent}`}
                fill="none"
                stroke="#1a7350"
                strokeWidth="0.22"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.62"
              />
            </g>
          );
        });
      })}
    </svg>
  );
};

const PedigreeBox = ({
  node,
  nodeKey,
  top,
  columnSize,
  isRTL,
  onClick,
  highlighted,
  related,
  onNodeHover,
  canExpand,
  isExpanding,
  isExhausted,
  onExpand,
}: {
  node: PedigreeNode;
  nodeKey: string;
  top: number;
  columnSize: number;
  isRTL: boolean;
  onClick: (node: PedigreeNode) => void;
  highlighted: boolean;
  related: boolean;
  onNodeHover: (node: PedigreeNode | null) => void;
  canExpand?: boolean;
  isExpanding?: boolean;
  isExhausted?: boolean;
  onExpand?: (node: PedigreeNode, nodeKey: string) => void;
}) => {
  const boxHeight =
    columnSize > 24
      ? 44
      : columnSize > 16
        ? 50
        : columnSize > 8
          ? 60
          : node.role === "Root"
            ? 108
            : 88;
  const fontSize = isRTL
    ? node.role === "Root"
      ? 48
      : node.generationIndex === 1
        ? 38
        : node.generationIndex === 2
          ? 32
          : columnSize > 16
            ? 18
            : columnSize > 8
              ? 24
              : 28
    : node.role === "Root"
      ? 30
      : columnSize > 16
        ? 16
        : 20;
  const displayName = isRTL
    ? decorateArabicName(node.name, `${node.id}-${node.generationIndex}-${node.nodeIndex}`)
    : node.name;

  return (
    <div
      dir="ltr"
      className="group absolute left-0 right-0 px-1"
      style={{
        top: `calc(${top}% - ${boxHeight / 2}px)`,
        height: `${boxHeight}px`,
      }}
    >
      <button
        type="button"
        onClick={() => {
          if (canExpand && onExpand && !isExhausted && !node.localId) {
            onExpand(node, nodeKey);
            return;
          }

          onClick(node);
        }}
        onMouseEnter={() => onNodeHover(node)}
        onMouseLeave={() => onNodeHover(null)}
        onFocus={() => onNodeHover(node)}
        onBlur={() => onNodeHover(null)}
        className={`relative flex h-full w-full flex-col items-center justify-center gap-1 overflow-visible rounded-[6px] bg-transparent px-1 text-center text-[#159456] focus:outline-none focus:ring-2 focus:ring-[#159456]/20 ${
          isExpanding ? "cursor-wait opacity-70" : ""
        }`}
        title={
          canExpand && !isExhausted && !node.localId
            ? isRTL
              ? "عرض أجداد هذا الخيل"
              : "Show this horse's ancestors"
            : node.name
        }
        style={
          node.duplicateColor
            ? {
                zIndex: highlighted ? 10 : undefined,
                direction: "ltr",
                unicodeBidi: "isolate",
                fontFamily: isRTL
                  ? "'Diwani Letter', 'SF Pro AR', serif"
                  : "'SF Pro AR', serif",
                fontSize,
              }
            : {
                direction: "ltr",
                unicodeBidi: "isolate",
                fontFamily: isRTL
                  ? "'Diwani Letter', 'SF Pro AR', serif"
                  : "'SF Pro AR', serif",
                fontSize,
              }
        }
      >
        <ParentIcon role={node.role} />
        <span
          className="block min-w-0 max-w-full overflow-visible whitespace-nowrap py-2 transition-colors duration-150 drop-shadow-[0_1px_0_rgba(255,255,255,0.45)] group-hover:font-semibold group-hover:text-[#005f38] group-hover:[text-shadow:0_0_1px_rgba(0,95,56,0.45),0_1px_0_rgba(255,255,255,0.65)] group-focus-visible:font-semibold group-focus-visible:text-[#005f38]"
          style={{
            color:
              highlighted && node.duplicateColor
                ? node.duplicateColor.border
                : related
                  ? "#b35d18"
                : undefined,
            textShadow:
              highlighted && node.duplicateColor
                ? `0 0 1px ${node.duplicateColor.border}55`
                : related
                  ? "0 0 1px rgba(179,93,24,0.45), 0 1px 0 rgba(255,255,255,0.7)"
                : undefined,
          }}
        >
          {displayName}
        </span>
      </button>

      {isExhausted ? (
        <div className="pointer-events-none absolute bottom-0 right-1 z-30 max-w-[calc(100%-8px)] rounded-full border border-[#159456]/20 bg-[#f2f5c6]/90 px-2 py-1 text-[9px] font-bold text-[#0f7543] opacity-0 shadow-sm transition group-hover:opacity-100">
          {isRTL ? "لا يوجد أجداد أكثر" : "No more ancestors"}
        </div>
      ) : null}
    </div>
  );
};

const normalizeTagName = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

const PedigreeTagsEditor = ({
  horseId,
  idType,
  horseEnglishName,
  horseArabicName,
  tags,
  isRTL,
  locale,
  onChange,
}: {
  horseId: number;
  idType: "local" | "studbook";
  horseEnglishName?: string | null;
  horseArabicName?: string | null;
  tags: HorseTagDto[];
  isRTL: boolean;
  locale: string;
  onChange: (tags: HorseTagDto[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const directTags = tags.filter((tag) => !tag.isInherited);
  const canAdd = directTags.length === 0;
  const labels = {
    title: isRTL ? "وسوم العائلة" : "Family tags",
    add: isRTL ? "إضافة وسم" : "Add tag",
    save: isRTL ? "حفظ" : "Save",
    cancel: isRTL ? "إلغاء" : "Cancel",
    placeholder: isRTL ? "أضف وسمًا لهذا الخيل" : "Add a tag for this horse",
    oneTagBlock: isRTL
      ? "يمكن إضافة وسم واحد فقط لكل خيل — عدّل أو احذف الوسم الحالي"
      : "Only one tag per horse — edit or delete the existing tag",
    noTags: isRTL ? "لا توجد وسوم" : "No tags",
    required: isRTL ? "اسم الوسم مطلوب." : "Tag name is required.",
    duplicate: isRTL ? "هذا الوسم موجود بالفعل." : "This tag already exists.",
    error: isRTL ? "تعذر حفظ الوسم." : "Failed to save tag.",
    inherited: isRTL ? "موروث" : "Inherited",
  };
  const directNames = useMemo(
    () => new Set(directTags.map((tag) => normalizeTagName(tag.name))),
    [directTags],
  );

  const sourceName = (tag: HorseTagDto) => {
    const en = tag.sourceHorseEnglishName?.trim();
    const ar = tag.sourceHorseArabicName?.trim();
    return isRTL ? ar || en || "" : en || ar || "";
  };

  async function saveTag(
    method: "POST" | "PUT" | "DELETE",
    tagId?: number,
    nextName?: string,
  ) {
    setSaving(true);
    setError("");

    try {
      const result = await clientApiFetch<ApiResult<HorseTagDto[]>>({
        method,
        backendPath: tagId
          ? `/api/Horses/${horseId}/tags/${tagId}`
          : `/api/Horses/${horseId}/tags`,
        nextPath: tagId
          ? `/api/horses/${horseId}/tags/${tagId}`
          : `/api/horses/${horseId}/tags`,
        backendQuery: { idType },
        nextQuery: { locale, idType },
        locale: locale as LocaleCode,
        body:
          method === "DELETE"
            ? undefined
            : method === "POST"
              ? {
                  name: nextName,
                  englishName: horseEnglishName ?? null,
                  arabicName: horseArabicName ?? null,
                }
              : { name: nextName },
      });

      if (result.succeeded === false) {
        throw new Error(result.message || labels.error);
      }

      onChange(result.data ?? []);
      setName("");
      setEditingId(null);
      setEditingName("");
      if (method !== "DELETE") setOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : labels.error);
    } finally {
      setSaving(false);
    }
  }

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const cleaned = name.trim().replace(/\s+/g, " ");

    if (!cleaned) {
      setError(labels.required);
      return;
    }

    if (directNames.has(normalizeTagName(cleaned))) {
      setError(labels.duplicate);
      return;
    }

    saveTag("POST", undefined, cleaned);
  }

  function startEdit(tag: HorseTagDto) {
    setOpen(true);
    setError("");
    setEditingId(tag.id);
    setEditingName(tag.name);
  }

  function openAddForm() {
    setOpen(true);
    setError("");
    setEditingId(null);
    setEditingName("");
  }

  function handleUpdate(tag: HorseTagDto) {
    const cleaned = editingName.trim().replace(/\s+/g, " ");

    if (!cleaned) {
      setError(labels.required);
      return;
    }

    const duplicate = directTags.some(
      (item) =>
        item.id !== tag.id &&
        normalizeTagName(item.name) === normalizeTagName(cleaned),
    );

    if (duplicate) {
      setError(labels.duplicate);
      return;
    }

    saveTag("PUT", tag.id, cleaned);
  }

  return (
    <section className="rounded-[16px] border border-[#e8dbcf] bg-[#fffdfa] p-4 shadow-[0_8px_22px_rgba(61,42,27,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[#3d2a1b]">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f7f1eb] text-[#6f4127] shadow-sm">
              <Tag className="h-4 w-4" />
            </span>
            <span className="text-lg font-black">{labels.title}</span>
          </div>

          {!open ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.length ? (
                tags.slice(0, 5).map((tag) => (
                  <span
                    key={`${tag.id}-${tag.sourceHorseId}-${tag.isInherited ? "i" : "d"}`}
                    className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-black shadow-[0_2px_7px_rgba(52,35,22,0.08)] ${
                      tag.isInherited
                        ? "border-[#9dccaa] bg-[#e6f8ea] text-[#155d37]"
                        : "border-[#e2bd90] bg-[#fff0d6] text-[#5c3420]"
                    }`}
                    title={
                      tag.isInherited && sourceName(tag)
                        ? `${tag.name} - ${sourceName(tag)}`
                        : tag.name
                    }
                  >
                    <Tag className="h-4 w-4 shrink-0" />
                    <span className="truncate">{tag.name}</span>
                    {tag.isInherited && sourceName(tag) ? (
                      <span className="max-w-[130px] truncate text-xs font-black opacity-75">
                        <GitBranch className="me-1 inline h-3.5 w-3.5" />
                        {sourceName(tag)}
                      </span>
                    ) : null}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-dashed border-[#d9c9bd] px-3 py-2 text-sm font-bold text-[#8b7a6e]">
                  {labels.noTags}
                </span>
              )}
              {tags.length > 5 ? (
                <span className="rounded-full bg-[#f7f1eb] px-3 py-2 text-sm font-black text-[#6f4127]">
                  +{tags.length - 5}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {open ? (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setError("");
              setEditingId(null);
              setEditingName("");
            }}
            disabled={saving}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[#e8dbcf] bg-white text-[#6f4127] transition hover:bg-[#f7f1eb]"
            aria-label={labels.cancel}
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={openAddForm}
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#3d2a1b] px-4 text-sm font-black text-white shadow-[0_8px_18px_rgba(61,42,27,0.16)] transition hover:bg-[#513823] disabled:cursor-not-allowed disabled:bg-[#cbbcad] disabled:shadow-none"
          >
            {canAdd ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {canAdd ? labels.add : isRTL ? "إدارة الوسم" : "Manage tag"}
          </button>
        )}
      </div>

      {open ? (
        <div className="mt-4 border-t border-[#eee3d9] pt-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {tags.length ? (
              tags.map((tag) => (
                <div
                  key={`editor-${tag.id}-${tag.sourceHorseId}-${tag.isInherited ? "i" : "d"}`}
                  className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm shadow-sm ${
                    tag.isInherited
                      ? "border-[#bcdac6] bg-[#eef8f1] text-[#245338]"
                      : "border-[#e6c9ad] bg-[#fff3e2] text-[#63391f]"
                  }`}
                >
                  {editingId === tag.id && !tag.isInherited ? (
                    <>
                      <input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        maxLength={80}
                        disabled={saving}
                        className="h-9 w-44 rounded-lg border border-[#d9c9bd] bg-white px-3 font-bold outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdate(tag)}
                        disabled={saving}
                        className="grid h-8 w-8 place-items-center rounded-full bg-[#3d2a1b] text-white disabled:opacity-60"
                        aria-label={labels.save}
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        disabled={saving}
                        className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#6f4127] disabled:opacity-60"
                        aria-label={labels.cancel}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Tag className="h-4 w-4 shrink-0" />
                      <span className="font-black">{tag.name}</span>
                      {tag.isInherited ? (
                        <span className="text-xs font-bold opacity-75">
                          <GitBranch className="me-1 inline h-3.5 w-3.5" />
                          {sourceName(tag) || labels.inherited}
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(tag)}
                            disabled={saving}
                            className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#6f4127] disabled:opacity-60"
                            aria-label={isRTL ? "تعديل" : "Edit"}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => saveTag("DELETE", tag.id)}
                            disabled={saving}
                            className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#a6423a] disabled:opacity-60"
                            aria-label={isRTL ? "حذف" : "Delete"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              ))
            ) : (
              <span className="rounded-xl border border-dashed border-[#d9c9bd] px-3 py-2 text-sm text-[#8b7a6e]">
                {labels.noTags}
              </span>
            )}
          </div>

          <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              disabled={!canAdd || saving}
              placeholder={canAdd ? labels.placeholder : labels.oneTagBlock}
              className="h-11 min-w-0 flex-1 rounded-xl border border-[#d9c9bd] bg-[#fdfbf7] px-3 text-sm font-bold text-[#2a2a2a] outline-none focus:border-[#3d2a1b] disabled:bg-[#f1ece7]"
            />
            <button
              type="submit"
              disabled={!canAdd || saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#3d2a1b] px-4 text-sm font-black text-white disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {labels.save}
            </button>
          </form>

          {error ? (
            <div className="mt-3 rounded-xl border border-[#f2c7c7] bg-[#fff3f3] px-3 py-2 text-sm font-bold text-[#b04444]">
              {error}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

const PedigreeTagsSkeleton = () => (
  <section className="animate-pulse rounded-[16px] border border-[#e8dbcf] bg-[#fffdfa] p-4 shadow-[0_8px_22px_rgba(61,42,27,0.05)]">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="h-9 w-9 rounded-full bg-[#f0e7dc]" />
        <span className="h-5 w-28 rounded-full bg-[#f0e7dc]" />
      </div>
      <span className="h-11 w-28 rounded-xl bg-[#f0e7dc]" />
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      <span className="h-10 w-24 rounded-full bg-[#f0e7dc]" />
      <span className="h-10 w-32 rounded-full bg-[#f0e7dc]" />
    </div>
  </section>
);

const PedigreeReadonlyTags = ({
  tags,
  isRTL,
}: {
  tags: HorseTagDto[];
  isRTL: boolean;
}) => {
  const sourceName = (tag: HorseTagDto) => {
    const en = tag.sourceHorseEnglishName?.trim();
    const ar = tag.sourceHorseArabicName?.trim();
    return isRTL ? ar || en || "" : en || ar || "";
  };

  return (
    <section className="rounded-[16px] border border-[#e8dbcf] bg-[#fffdfa] p-4 shadow-[0_8px_22px_rgba(61,42,27,0.05)]">
      <div className="mb-3 flex items-center gap-2 text-[#3d2a1b]">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f7f1eb] text-[#6f4127] shadow-sm">
          <Tag className="h-4 w-4" />
        </span>
        <span className="text-lg font-black">
          {isRTL ? "وسوم العائلة" : "Family tags"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {!tags.length ? (
          <span className="rounded-full border border-dashed border-[#d9c9bd] px-3 py-2 text-sm font-bold text-[#8b7a6e]">
            {isRTL ? "لا توجد وسوم" : "No tags"}
          </span>
        ) : null}
        {tags.map((tag) => (
          <span
            key={`readonly-${tag.id}-${tag.sourceHorseId}-${tag.isInherited ? "i" : "d"}`}
            className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-black shadow-[0_2px_7px_rgba(52,35,22,0.08)] ${
              tag.isInherited
                ? "border-[#9dccaa] bg-[#e6f8ea] text-[#155d37]"
                : "border-[#e2bd90] bg-[#fff0d6] text-[#5c3420]"
            }`}
          >
            <Tag className="h-4 w-4 shrink-0" />
            <span className="truncate">{tag.name}</span>
            {tag.isInherited && sourceName(tag) ? (
              <span className="max-w-[130px] truncate text-xs font-black opacity-75">
                <GitBranch className="me-1 inline h-3.5 w-3.5" />
                {sourceName(tag)}
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </section>
  );
};

export const HorsePedigreeTree: FC<HorsePedigreeTreeProps> = ({
  horse,
  showTitle = true,
  controlsVariant = "default",
  pedigreeData,
  loading = false,
  onTagsMutated,
}) => {
  const router = useRouter();
  const onTagsMutatedRef = useRef(onTagsMutated);
  onTagsMutatedRef.current = onTagsMutated;
  const { direction, locale } = useLocale();
  const isRTL = direction === "rtl";
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);

  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [apiColumns, setApiColumns] = useState<PedigreeNode[][]>([]);
  const [branchSteps, setBranchSteps] = useState<BranchExpansion[]>([]);
  const [activeBranchStepIndex, setActiveBranchStepIndex] = useState<number | null>(null);
  const [exhaustedBranchKeys, setExhaustedBranchKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [branchLoadingKey, setBranchLoadingKey] = useState<string | null>(null);
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
  const [summaryTagsLoading, setSummaryTagsLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [hoveredNode, setHoveredNode] = useState<PedigreeNode | null>(null);

  const orderedColumns = useMemo(() => [...apiColumns].reverse(), [apiColumns]);
  const topMetaItems = useMemo(() => getTopMetaItems(horse, isRTL), [horse, isRTL]);
  const maxLeafCount = useMemo(
    () => Math.max(1, ...apiColumns.map((column) => column.length)),
    [apiColumns],
  );
  const hasPedigree = apiColumns.length > 0;
  const canExpandPedigree =
    !pedigreeData &&
    hasLocalId &&
    hasPedigree &&
    apiColumns.length < MAX_PEDIGREE_LEVELS;
  const certificateMinWidth = Math.max(
    CERTIFICATE_BASE_WIDTH_PX,
    apiColumns.length * MIN_COLUMN_WIDTH_PX,
  );
  const certificateScrollableHeight = Math.max(
    Math.round(CERTIFICATE_BASE_WIDTH_PX / CERTIFICATE_ASPECT),
    Math.round(certificateMinWidth / CERTIFICATE_ASPECT),
  );
  const shouldUseScrollableCanvas = isNarrowViewport || isMobileViewport;
  const activeBranchStep =
    activeBranchStepIndex === null ? null : branchSteps[activeBranchStepIndex] ?? null;
  const hoveredRelationIds = useMemo(() => {
    if (!hoveredNode) return new Set<string>();

    const relatedIds = new Set<string>();
    const hoverStudbookId = hoveredNode.studbookId;
    const parentIds = [hoveredNode.fatherId, hoveredNode.motherId]
      .filter((id): id is number => Boolean(id))
      .map(String);
    const allVisibleNodes = [
      ...apiColumns.flat(),
      ...(activeBranchStep?.columns.flat() ?? []),
    ];

    parentIds.forEach((id) => relatedIds.add(id));

    if (hoverStudbookId) {
      allVisibleNodes.forEach((node) => {
        if (
          node.fatherId === hoverStudbookId ||
          node.motherId === hoverStudbookId
        ) {
          relatedIds.add(String(node.studbookId ?? node.id));
        }
      });
    }

    relatedIds.delete(String(hoveredNode.studbookId ?? hoveredNode.id));

    return relatedIds;
  }, [activeBranchStep, apiColumns, hoveredNode]);

  useEffect(() => {
    if (pedigreeData !== undefined) {
      setTreeError("");
      setIsTreeLoading(loading);
      setBranchSteps([]);
      setActiveBranchStepIndex(null);
      setExhaustedBranchKeys(new Set());
      setBranchLoadingKey(null);

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
      setBranchSteps([]);
      setActiveBranchStepIndex(null);
      setExhaustedBranchKeys(new Set());
      setBranchLoadingKey(null);
      return;
    }

    let mounted = true;

    async function loadPedigree() {
      setIsTreeLoading(true);
      setTreeError("");
      setApiColumns([]);
      setBranchSteps([]);
      setActiveBranchStepIndex(null);
      setExhaustedBranchKeys(new Set());
      setBranchLoadingKey(null);

      try {
        const result = await getHorsePedigree({
          localId: numericLocalId,
          levels: INITIAL_PEDIGREE_LEVELS,
        });
        const levels = normalizePedigreeLevels(result.data);
        const mappedLevels = mapPedigreeLevels(levels, isRTL);

        if (mounted) {
          setApiColumns(mappedLevels);

          // The backend caches this pedigree right after responding; refresh
          // the profile tags shortly after so inherited tags resolved through
          // the cached tree appear without a manual reload.
          window.setTimeout(() => {
            if (mounted) onTagsMutatedRef.current?.();
          }, 2500);
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

  const handleExpandBranch = async (node: PedigreeNode, nodeKey: string) => {
    const horseId = node.studbookId ?? Number(node.id);
    const maxAdditionalLevels = Math.max(
      0,
      MAX_PEDIGREE_LEVELS - node.generationIndex,
    );

    if (
      !canExpandPedigree ||
      !Number.isFinite(horseId) ||
      horseId <= 0 ||
      maxAdditionalLevels <= 0 ||
      branchLoadingKey
    ) {
      return;
    }

    const existingIndex = branchSteps.findIndex((step) => step.nodeKey === nodeKey);
    if (existingIndex >= 0) {
      setSummaryOpen(false);
      setActiveBranchStepIndex(existingIndex);
      return;
    }

    const requestedLevels = Math.min(
      maxAdditionalLevels,
      PEDIGREE_LEVEL_STEP,
    );

    try {
      setSummaryOpen(false);
      setBranchLoadingKey(nodeKey);
      setTreeError("");

      const result = await getHorsePedigreeBranch({
        horseId,
        levels: requestedLevels,
        fatherId: node.fatherId,
        motherId: node.motherId,
        englishName: node.englishName,
        arabicName: node.arabicName,
        fatherEnglishName: node.fatherEnglishName,
        fatherArabicName: node.fatherArabicName,
        motherEnglishName: node.motherEnglishName,
        motherArabicName: node.motherArabicName,
      });
      const levels = normalizePedigreeLevels(result.data);
      const mappedLevels = mapPedigreeLevels(levels, isRTL);

      if (mappedLevels.length <= 1) {
        setExhaustedBranchKeys((current) => {
          const next = new Set(current);
          next.add(nodeKey);
          return next;
        });
        return;
      }

      const step: BranchExpansion = {
        nodeKey,
        horseId,
        title: node.name,
        rootNode: node,
        columns: mappedLevels,
        requestedLevels,
        maxAdditionalLevels,
        endReached:
          requestedLevels >= maxAdditionalLevels ||
          mappedLevels.length <= 1,
      };

      setBranchSteps((current) => {
        const next = nodeKey.startsWith("modal-") ? [...current, step] : [step];
        setActiveBranchStepIndex(next.length - 1);
        return next;
      });
    } catch (requestError) {
      setTreeError(
        requestError instanceof Error
          ? requestError.message
          : isRTL
            ? "تعذر تحميل أجداد هذا الخيل."
            : "Failed to load this horse's ancestors.",
      );
    } finally {
      setBranchLoadingKey(null);
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

    // Refresh this horse's tags from the tags API so the popup always shows
    // the full effective list, not just what the tree enrichment attached.
    fetchNodeTags(node);

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

  const applyNodeTags = (ref: PedigreeNode, tags: HorseTagDto[]) => {
    const matches = (node: PedigreeNode) =>
      ref.localId
        ? node.localId === ref.localId
        : Boolean(ref.studbookId) && node.studbookId === ref.studbookId;

    // The API response for external horses holds direct tags only, so keep
    // the inherited chips the tree enrichment already attached to the node.
    const nextTagsFor = (node: PedigreeNode) => {
      const names = new Set(tags.map((tag) => normalizeTagName(tag.name)));
      const keptInherited = (node.tags ?? []).filter(
        (tag) => tag.isInherited && !names.has(normalizeTagName(tag.name)),
      );
      return [...tags, ...keptInherited];
    };

    const applyTags = (columns: PedigreeNode[][]) =>
      columns.map((column) =>
        column.map((node) =>
          matches(node) ? { ...node, tags: nextTagsFor(node) } : node,
        ),
      );

    setApiColumns((current) => applyTags(current));
    setBranchSteps((current) =>
      current.map((step) => ({
        ...step,
        rootNode: matches(step.rootNode)
          ? { ...step.rootNode, tags: nextTagsFor(step.rootNode) }
          : step.rootNode,
        columns: applyTags(step.columns),
      })),
    );
    setSummaryNode((current) =>
      current && matches(current)
        ? { ...current, tags: nextTagsFor(current) }
        : current,
    );
  };

  const updateNodeTags = (ref: PedigreeNode, tags: HorseTagDto[]) => {
    applyNodeTags(ref, tags);

    // Let the parent page (horse profile) re-fetch its own tags so inherited
    // tags from the horse that was just tagged show up without a reload.
    onTagsMutatedRef.current?.();
  };

  const fetchNodeTags = (node: PedigreeNode) => {
    const tagsHorseId = node.localId ?? node.studbookId;
    if (!tagsHorseId) return;

    const idType = node.localId ? "local" : "studbook";

    setSummaryTagsLoading(true);

    clientApiFetch<ApiResult<HorseTagDto[]>>({
      backendPath: `/api/Horses/${tagsHorseId}/tags`,
      nextPath: `/api/horses/${tagsHorseId}/tags`,
      backendQuery: { idType },
      nextQuery: { locale, idType },
      locale: locale as LocaleCode,
    })
      .then((result) => {
        if (result.succeeded !== false) applyNodeTags(node, result.data ?? []);
      })
      .catch(() => {
        // Keep the tags already attached to the tree node.
      })
      .finally(() => {
        setSummaryTagsLoading(false);
      });
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
          className="rounded-[26px] bg-[#e8ead1] p-2 sm:p-3"
          dir="ltr"
          style={{ direction: "ltr" }}
        >
          <div
            className="relative mx-auto aspect-[1600/1340] w-full overflow-hidden rounded-[6px] bg-[#f2f5c6] shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
            dir="ltr"
            style={{ direction: "ltr", maxWidth: `${CERTIFICATE_BASE_WIDTH_PX}px` }}
          >
            <CertificateBorder />

            <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-8">
              <img
                src="/WhatsApp%20Image%202026-06-29%20at%204.11.34%20PM.jpeg"
                alt="Pedigree Center Logo"
                className="h-auto w-[74%] max-w-[920px] object-contain opacity-[0.075] mix-blend-multiply"
              />
            </div>

            <div className="relative z-10 flex h-full flex-col px-7 pb-7 pt-5 sm:px-9 sm:pb-9 sm:pt-7 lg:px-10 lg:pb-10 lg:pt-8 xl:px-12">
              <TopMetaRow
                isRTL={isRTL}
                items={[
                  { label: isRTL ? "النوع" : "Gender", value: "..." },
                  { label: isRTL ? "تاريخ الميلاد" : "Birth Date", value: "..." },
                  { label: isRTL ? "الرسن" : "Strain", value: "..." },
                  { label: isRTL ? "المنتج" : "Breeder", value: "..." },
                  { label: isRTL ? "المربي" : "Owner", value: "..." },
                ]}
              />

              <div
                className="relative min-h-0 flex-1 animate-pulse pt-4"
                dir="ltr"
                style={{
                  direction: "ltr",
                  fontFamily: isRTL
                    ? "'Diwani Letter', 'SF Pro AR', serif"
                    : "'SF Pro AR', serif",
                }}
              >
                {[32, 21, 13, 8, 3, 1].map((count, columnIndex, columns) => {
                  const columnCount = columns.length;
                  const gapPx = 10;
                  const columnWidth = `calc((100% - ${
                    (columnCount - 1) * gapPx
                  }px) / ${columnCount})`;

                  return (
                    <div
                      key={`skeleton-column-${columnIndex}`}
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
                      {Array.from({ length: count }).map((__, itemIndex) => (
                        <div
                          key={`skeleton-${columnIndex}-${itemIndex}`}
                          className="absolute left-1 right-1 rounded-full bg-[#159456]/20"
                          style={{
                            top: `calc(${getTopPercent(
                              count,
                              itemIndex,
                              32,
                              count > 16 ? 4 : 3,
                            )}% - ${columnIndex > 4 ? 15 : 8}px)`,
                            height: columnIndex > 4 ? 30 : 16,
                          }}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
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
          className={`rounded-[26px] bg-[#e8ead1] p-2 sm:p-3 ${
            isFullscreen && !isMobileViewport
              ? "flex min-h-screen items-center justify-center bg-[#e8ead1]"
              : ""
          } ${
            isFullscreen && isMobileViewport
              ? "fixed inset-0 z-[70] rounded-none bg-[#e8ead1] p-3"
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
            className={`flex w-full justify-center rounded-[22px] ${
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
              className="relative overflow-hidden rounded-[6px] bg-[#f2f5c6] shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
              style={{
                aspectRatio: `${CERTIFICATE_ASPECT}`,
                width: shouldUseScrollableCanvas
                  ? `${certificateMinWidth}px`
                  : isFullscreen
                    ? `min(96vw, calc((100dvh - 72px) * ${CERTIFICATE_ASPECT}))`
                    : `min(100%, ${CERTIFICATE_BASE_WIDTH_PX}px)`,
                minWidth: shouldUseScrollableCanvas
                  ? `${certificateMinWidth}px`
                  : undefined,
                height: shouldUseScrollableCanvas
                  ? `${certificateScrollableHeight}px`
                  : undefined,
                maxWidth: isFullscreen ? undefined : `${CERTIFICATE_BASE_WIDTH_PX}px`,
              }}
            >
              <CertificateBorder />

              <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-8">
                <img
                  src="/WhatsApp%20Image%202026-06-29%20at%204.11.34%20PM.jpeg"
                  alt="Pedigree Center Logo"
                  className="h-auto w-[74%] max-w-[920px] object-contain opacity-[0.075] mix-blend-multiply"
                />
              </div>

              <div className="relative z-10 flex h-full flex-col px-7 pb-7 pt-5 sm:px-9 sm:pb-9 sm:pt-7 lg:px-10 lg:pb-10 lg:pt-8 xl:px-12">
                <TopMetaRow items={topMetaItems} isRTL={isRTL} />

                <div
                  dir="ltr"
                  className="relative min-h-0 flex-1 pt-4"
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
                        {column.map((node, nodeIndex) => {
                          const nodeKey = `${columnIndex}-${nodeIndex}-${node.id}`;
                          const maxAdditionalLevels =
                            MAX_PEDIGREE_LEVELS - node.generationIndex;

                          return (
                            <PedigreeBox
                              key={nodeKey}
                              nodeKey={nodeKey}
                              node={node}
                              isRTL={isRTL}
                              columnSize={column.length}
                              top={getTopPercent(
                                column.length,
                                nodeIndex,
                                maxLeafCount,
                                column.length > 16 ? 4 : 3,
                              )}
                              onClick={handleNodeClick}
                              highlighted={Boolean(
                                node.duplicateColor &&
                                  hoveredNode?.id === node.id,
                              )}
                              related={hoveredRelationIds.has(String(node.studbookId ?? node.id))}
                              onNodeHover={setHoveredNode}
                              canExpand={
                                canExpandPedigree &&
                                columnIndex === 0 &&
                                maxAdditionalLevels > 0 &&
                                Boolean(node.studbookId)
                              }
                              isExpanding={branchLoadingKey === nodeKey}
                              isExhausted={exhaustedBranchKeys.has(nodeKey)}
                              onExpand={handleExpandBranch}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {activeBranchStep ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/55 p-3"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSummaryOpen(false);
              setActiveBranchStepIndex(null);
            }
          }}
        >
          <div
            dir={direction}
            className="flex h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-[18px] bg-[#e8ead1] p-3 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between gap-3 rounded-[14px] bg-[#f2f5c6]/70 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(21,148,86,0.12)]">
              <div
                className="flex min-w-0 flex-1 items-center overflow-x-auto px-1 py-1"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {branchSteps.map((step, index) => {
                  const active = index === activeBranchStepIndex;
                  const label = isRTL
                    ? decorateArabicName(step.title, `${step.nodeKey}-step`)
                    : step.title;

                  return (
                    <div
                      key={step.nodeKey}
                      className="flex shrink-0 items-center"
                    >
                      {index > 0 ? (
                        <span className="mx-1 h-[2px] w-8 rounded-full bg-[#159456]/35" />
                      ) : null}

                      <button
                        type="button"
                        onClick={() => setActiveBranchStepIndex(index)}
                        className={`flex min-w-[118px] items-center gap-2 rounded-full border px-2.5 py-1.5 text-sm font-bold transition ${
                          active
                            ? "border-[#159456] bg-[#159456] text-white shadow-[0_8px_20px_rgba(21,148,86,0.22)]"
                            : "border-[#159456]/25 bg-[#fbffd8] text-[#0f7543] hover:border-[#159456]/70 hover:text-[#0b7d48]"
                        }`}
                        title={step.title}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                            active
                              ? "bg-white text-[#159456]"
                              : "bg-[#159456]/10 text-[#0f7543]"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="max-w-[150px] truncate">{label}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSummaryOpen(false);
                  setActiveBranchStepIndex(null);
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#203529] shadow"
                aria-label={isRTL ? "إغلاق" : "Close"}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-[14px] bg-[#e8ead1] p-2" dir="ltr">
              <div
                className="relative mx-auto h-full min-h-[720px] w-[1040px] max-w-full overflow-hidden rounded-[6px] bg-[#f2f5c6] shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
                style={{ aspectRatio: `${CERTIFICATE_ASPECT}` }}
              >
                <CertificateBorder />

                <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-8">
                  <img
                    src="/WhatsApp%20Image%202026-06-29%20at%204.11.34%20PM.jpeg"
                    alt="Pedigree Center Logo"
                    className="h-auto w-[74%] max-w-[820px] object-contain opacity-[0.075] mix-blend-multiply"
                  />
                </div>

                <div className="relative z-10 flex h-full flex-col px-6 pb-8 pt-7">
                  <div
                    className="mb-2 pb-3 text-center text-[#159456]"
                    style={{
                      fontFamily: isRTL
                        ? "'Diwani Letter', 'SF Pro AR', serif"
                        : "'SF Pro AR', serif",
                    }}
                  >
                    <span className="text-[34px]">
                      {isRTL
                        ? decorateArabicName(activeBranchStep.title, `${activeBranchStep.nodeKey}-title`)
                        : activeBranchStep.title}
                    </span>
                    <div className="mx-10 mt-3 h-[3px] rounded-full bg-[#159456]" />
                  </div>

                  <div className="relative min-h-0 flex-1 pt-4" dir="ltr">
                    {(() => {
                      const columns = [...activeBranchStep.columns].reverse();
                      const modalMaxLeafCount = Math.max(
                        1,
                        ...activeBranchStep.columns.map((level) => level.length),
                      );

                      return (
                        <>
                          <PedigreeConnectors
                            columns={columns}
                            maxLeafCount={modalMaxLeafCount}
                          />

                          {columns.map((column, columnIndex) => {
                      const columnCount = Math.max(1, columns.length);
                      const gapPx = 10;
                      const columnWidth = `calc((100% - ${
                        (columnCount - 1) * gapPx
                      }px) / ${columnCount})`;

                      return (
                        <div
                          key={`branch-modal-${activeBranchStep.nodeKey}-${columnIndex}`}
                          className="absolute top-0 z-10 h-full"
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
                          {column.map((node, nodeIndex) => {
                            const nodeKey = `modal-${activeBranchStep.nodeKey}-${columnIndex}-${nodeIndex}-${node.id}`;
                            const maxAdditionalLevels =
                              MAX_PEDIGREE_LEVELS - node.generationIndex;

                            return (
                              <PedigreeBox
                                key={nodeKey}
                                nodeKey={nodeKey}
                                node={node}
                                isRTL={isRTL}
                                columnSize={column.length}
                                top={getTopPercent(
                                  column.length,
                                  nodeIndex,
                                  modalMaxLeafCount,
                                  column.length > 16 ? 4 : 3,
                                )}
                                onClick={handleNodeClick}
                                highlighted={Boolean(
                                  node.duplicateColor &&
                                    hoveredNode?.id === node.id,
                                )}
                                related={hoveredRelationIds.has(String(node.studbookId ?? node.id))}
                                onNodeHover={setHoveredNode}
                                canExpand={
                                  canExpandPedigree &&
                                  columnIndex === 0 &&
                                  node.role !== "Root" &&
                                  maxAdditionalLevels > 0 &&
                                  Boolean(node.studbookId)
                                }
                                isExpanding={branchLoadingKey === nodeKey}
                                isExhausted={exhaustedBranchKeys.has(nodeKey)}
                                onExpand={handleExpandBranch}
                              />
                            );
                          })}
                        </div>
                      );
                          })}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {summaryOpen && summaryNode ? (
              <div
                dir={direction}
                className="mt-3 max-h-[44dvh] overflow-auto rounded-[16px] border border-[#159456]/15 bg-white/92 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.10)]"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={summaryImage}
                      alt={summaryName || (isRTL ? "صورة الخيل" : "Horse image")}
                      className="h-14 w-14 shrink-0 rounded-[14px] object-cover"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-[#2b1a12]">
                        {summaryName || (isRTL ? "بيانات الخيل" : "Horse details")}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-[#7a6c63]">
                        {summaryNode.studbookId
                          ? `Studbook ID: ${summaryNode.studbookId}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {summaryNode.localId ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSummaryOpen(false);
                          setActiveBranchStepIndex(null);
                          router.push(`/${locale}/horses/${summaryNode.localId}`);
                        }}
                        className="inline-flex h-8 items-center justify-center rounded-full bg-[#3d2a1b] px-3 text-xs font-black text-white transition hover:bg-[#2c1f14]"
                      >
                        {isRTL ? "الملف الشخصي" : "View profile"}
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setSummaryOpen(false)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f7f1eb] text-[#3b2b20]"
                      aria-label={isRTL ? "إغلاق التفاصيل" : "Close details"}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {summaryLoading ? (
                  <div className="grid animate-pulse grid-cols-2 gap-2 md:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div
                        key={`branch-summary-skeleton-${index}`}
                        className="h-16 rounded-xl bg-[#f3ece4]"
                      />
                    ))}
                  </div>
                ) : summaryError ? (
                  <div className="rounded-xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444]">
                    {summaryError}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-sm text-[#3b2b20] md:grid-cols-4">
                    {[
                      [
                        isRTL ? "النوع" : "Gender",
                        localizeGender(
                          summaryHorse?.gender ?? summaryNode.gender,
                          isRTL ? "ar" : "en",
                        ),
                      ],
                      [
                        isRTL ? "تاريخ الميلاد" : "Date of birth",
                        formatDate(summaryHorse?.dateofBirth ?? summaryNode.dateofBirth),
                      ],
                      [isRTL ? "الأب" : "Father", summaryFather && summaryFather !== "-" ? summaryFather : "-"],
                      [isRTL ? "الأم" : "Mother", summaryMother && summaryMother !== "-" ? summaryMother : "-"],
                      [isRTL ? "اللون" : "Color", summaryColor],
                      [isRTL ? "ولد في" : "Born in", summaryBornIn],
                      [isRTL ? "المالك" : "Owner", summaryOwner || "-"],
                      [isRTL ? "المربي" : "Breeder", summaryBreeder || "-"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-xl bg-[#fbf8f4] p-3"
                      >
                        <span className="block text-xs font-semibold text-[#7a6c63]">
                          {label}
                        </span>
                        <span className="mt-1 block truncate font-bold">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3">
                  {summaryTagsLoading ? (
                    <PedigreeTagsSkeleton />
                  ) : summaryNode.localId || summaryNode.studbookId ? (
                    <PedigreeTagsEditor
                      horseId={(summaryNode.localId ?? summaryNode.studbookId)!}
                      idType={summaryNode.localId ? "local" : "studbook"}
                      horseEnglishName={summaryNode.englishName}
                      horseArabicName={summaryNode.arabicName}
                      tags={summaryNode.tags ?? []}
                      isRTL={isRTL}
                      locale={locale}
                      onChange={(tags) => updateNodeTags(summaryNode, tags)}
                    />
                  ) : (
                    <PedigreeReadonlyTags
                      tags={summaryNode.tags ?? []}
                      isRTL={isRTL}
                    />
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {summaryOpen && !activeBranchStep ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSummaryOpen(false);
          }}
        >
          <div
            dir={direction}
            className="max-h-[94dvh] w-full max-w-5xl overflow-auto rounded-[24px] bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <img
                  src={summaryImage}
                  alt={summaryName || (isRTL ? "صورة الخيل" : "Horse image")}
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-md"
                />

                <div className="min-w-0">
                  <h3 className="truncate text-2xl font-black text-[#2b1a12]">
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

              <div className="flex shrink-0 items-center gap-2">
                {summaryNode?.localId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSummaryOpen(false);
                      router.push(`/${locale}/horses/${summaryNode.localId}`);
                    }}
                    className="inline-flex h-9 items-center justify-center rounded-full bg-[#3d2a1b] px-4 text-xs font-black text-white transition hover:bg-[#2c1f14]"
                  >
                    {isRTL ? "الملف الشخصي" : "View profile"}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setSummaryOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f7f1eb] text-[#3b2b20]"
                  aria-label={isRTL ? "إغلاق" : "Close"}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {summaryLoading ? (
              <div className="grid animate-pulse grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 11 }).map((_, index) => (
                  <div
                    key={`summary-skeleton-${index}`}
                    className="h-[74px] rounded-2xl bg-[#f3ece4]"
                  />
                ))}
              </div>
            ) : summaryError ? (
              <div className="rounded-2xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444]">
                {summaryError}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm text-[#3b2b20] md:grid-cols-3 xl:grid-cols-4">
                  <div className="rounded-2xl bg-[#fbf8f4] p-3">
                    <span className="block text-xs font-semibold text-[#7a6c63]">
                      {isRTL ? "النوع" : "Gender"}
                    </span>
                    <span className="mt-1 block font-bold">
                      {localizeGender(
                        summaryHorse?.gender ?? summaryNode?.gender,
                        isRTL ? "ar" : "en",
                      )}
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
              </>
            )}

            <div className="mt-4">
              {summaryTagsLoading ? (
                <PedigreeTagsSkeleton />
              ) : summaryNode && (summaryNode.localId || summaryNode.studbookId) ? (
                <PedigreeTagsEditor
                  horseId={(summaryNode.localId ?? summaryNode.studbookId)!}
                  idType={summaryNode.localId ? "local" : "studbook"}
                  horseEnglishName={summaryNode.englishName}
                  horseArabicName={summaryNode.arabicName}
                  tags={summaryNode.tags ?? []}
                  isRTL={isRTL}
                  locale={locale}
                  onChange={(tags) => updateNodeTags(summaryNode, tags)}
                />
              ) : (
                <PedigreeReadonlyTags
                  tags={summaryNode?.tags ?? []}
                  isRTL={isRTL}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
