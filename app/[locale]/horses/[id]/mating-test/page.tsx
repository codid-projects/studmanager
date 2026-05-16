"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { HorseAnalyticsTab, HorsePedigreeTree } from "@/components/horses";
import { clientApiFetch } from "@/lib/api/client";
import {
  getTestMatingTree,
  normalizePagedList,
  searchExternalHorses,
} from "@/lib/api/external-horses";
import { getLocalizedName } from "@/lib/api/localization";
import type {
  ApiResult,
  ExternalHorseSearchItem,
  ExternalTreeNode,
  HorseInfoDto,
} from "@/lib/api/types";
import { useLocale, useTranslation } from "@/lib/locale-context";

type SelectedHorse = {
  id: number;
  name: string;
  gender: string | null;
  dateofBirth: string | null;
};

function unwrapHorse(payload: ApiResult<HorseInfoDto> | HorseInfoDto | null): HorseInfoDto | null {
  if (!payload) return null;
  if (typeof payload === "object" && "data" in payload) return payload.data ?? null;
  return payload as HorseInfoDto;
}

function toSelectedHorse(item: ExternalHorseSearchItem, isArabic: boolean): SelectedHorse {
  return {
    id: item.id,
    name: getLocalizedName(item.englishName, item.arabicName, isArabic),
    gender: item.gender,
    dateofBirth: item.dateofBirth,
  };
}

function SearchHorsePicker({
  label,
  placeholder,
  selected,
  onSelect,
}: {
  label: string;
  placeholder: string;
  selected: SelectedHorse | null;
  onSelect: (horse: SelectedHorse) => void;
}) {
  const { locale, direction } = useLocale();
  const isArabic = locale === "ar";
  const isRTL = direction === "rtl";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExternalHorseSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError("");
      return;
    }

    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await searchExternalHorses({
          searchTerm: query.trim(),
          pageNumber: 1,
          pageSize: 8,
        });
        setResults(normalizePagedList(response).items);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : isArabic
              ? "تعذر البحث في سجل الخيول"
              : "Failed to search studbook horses",
        );
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [query, isArabic]);

  return (
    <div className="rounded-[20px] border border-[#d8c9bd] bg-white/80 p-4 shadow-sm">
      <label className="mb-2 block text-sm font-bold text-[#3b2b20]">{label}</label>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={selected ? selected.name : placeholder}
        className={`h-12 w-full rounded-2xl border border-[#cdbfb3] bg-white px-4 text-sm font-semibold text-[#45342b] outline-none transition placeholder:text-[#8c7d72] focus:border-[#3b2b20] ${
          isRTL ? "text-right" : "text-left"
        }`}
      />

      {selected ? (
        <div className="mt-3 rounded-2xl border border-[#d9c9bc] bg-[#f8f1ea] px-3 py-2 text-sm font-semibold text-[#3b2b20]">
          {selected.name}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-3 text-sm text-[#7a6c63]">{isArabic ? "جارٍ البحث..." : "Searching..."}</div>
      ) : null}
      {error ? <div className="mt-3 text-sm text-[#b04444]">{error}</div> : null}

      {results.length ? (
        <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-[#eadfd9] bg-white">
          {results.map((horse) => {
            const name = getLocalizedName(horse.englishName, horse.arabicName, isArabic);
            return (
              <button
                key={horse.id}
                type="button"
                onClick={() => {
                  onSelect(toSelectedHorse(horse, isArabic));
                  setQuery("");
                  setResults([]);
                }}
                className={`flex w-full items-center justify-between gap-3 border-b border-[#f1e8e1] px-4 py-3 text-sm transition last:border-b-0 hover:bg-[#faf6f1] ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                <span className="font-semibold text-[#2f2740]">{name}</span>
                <span className="shrink-0 text-xs text-[#8a776b]">
                  {horse.dateofBirth?.slice(0, 4) || "-"}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function MatingTestPage() {
  const params = useParams<{ id: string; locale: string }>();
  const { direction, locale } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === "rtl";
  const isArabic = locale === "ar";
  const localHorseId = Number(params.id);
  const [headerTab, setHeaderTab] = useState<"test" | "analysis">("test");
  const [sourceHorse, setSourceHorse] = useState<HorseInfoDto | null>(null);
  const [sourceError, setSourceError] = useState("");
  const [father, setFather] = useState<SelectedHorse | null>(null);
  const [mother, setMother] = useState<SelectedHorse | null>(null);
  const [matingTree, setMatingTree] = useState<ExternalTreeNode[][] | null>(null);
  const [matingLoading, setMatingLoading] = useState(false);
  const [matingError, setMatingError] = useState("");

  useEffect(() => {
    if (!localHorseId) return;

    let mounted = true;

    async function loadSourceHorse() {
      setSourceError("");

      try {
        const payload = await clientApiFetch<ApiResult<HorseInfoDto> | HorseInfoDto>({
          backendPath: `/api/Horses/${localHorseId}`,
          nextPath: `/api/horses/${localHorseId}`,
          locale: locale as "ar" | "en",
        });

        if (mounted) setSourceHorse(unwrapHorse(payload));
      } catch (requestError) {
        if (mounted) {
          setSourceError(
            requestError instanceof Error
              ? requestError.message
              : isArabic
                ? "تعذر تحميل بيانات الخيل"
                : "Failed to load horse details",
          );
        }
      }
    }

    loadSourceHorse();

    return () => {
      mounted = false;
    };
  }, [localHorseId, locale, isArabic]);

  const sourceName = useMemo(() => {
    if (!sourceHorse) return "";
    return getLocalizedName(sourceHorse.englishName, sourceHorse.arabicName, isArabic);
  }, [sourceHorse, isArabic]);

  const canShowAnalysis = Boolean(sourceHorse?.studbookId);

  const handleRunTestMating = async () => {
    if (!father?.id || !mother?.id) {
      setMatingError(isArabic ? "اختر الأب والأم من سجل الخيول أولاً." : "Select father and mother from the studbook first.");
      return;
    }

    setMatingLoading(true);
    setMatingError("");
    setMatingTree(null);

    try {
      const response = await getTestMatingTree({
        horseFatherStudbookId: father.id,
        horseMotherStudbookId: mother.id,
        levels: 6,
      });

      setMatingTree(response.data ?? []);
    } catch (requestError) {
      setMatingError(
        requestError instanceof Error
          ? requestError.message
          : isArabic
            ? "تعذر تحميل نتيجة اختبار التزاوج"
            : "Failed to load test mating result",
      );
    } finally {
      setMatingLoading(false);
    }
  };

  return (
    <MainLayout>
      <div
        className={`min-h-screen pb-12 ${isRTL ? "font-cairo text-right" : "text-left"}`}
        dir={direction}
      >
        <div className="flex items-start justify-between gap-4 px-1 pt-4" dir="ltr">
          <Link
            href={`/${locale}/horses/${localHorseId || ""}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#4a3324] transition hover:bg-white/70"
            aria-label={t("common.back")}
          >
            <Image
              src="/horse/back.svg"
              alt=""
              width={28}
              height={28}
              className={isRTL ? "" : "rotate-180"}
            />
          </Link>

          <div className="inline-flex gap-3" dir={isRTL ? "ltr" : "rtl"}>
            {canShowAnalysis ? (
              <button
                type="button"
                onClick={() => setHeaderTab("analysis")}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                  headerTab === "analysis"
                    ? "bg-[#3b2b20] text-white"
                    : "border border-[#e4d9cf] bg-white text-[#5a473d]"
                }`}
              >
                <Image
                  src="/horse/Analysis.svg"
                  alt=""
                  width={20}
                  height={20}
                  className={headerTab === "analysis" ? "brightness-0 invert" : ""}
                />
                <span>{t("matingTest.analysis")}</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setHeaderTab("test")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                headerTab === "test"
                  ? "bg-[#3b2b20] text-white"
                  : "border border-[#e4d9cf] bg-white text-[#5a473d]"
              }`}
            >
              <Image
                src="/horse/انساب-notactive.svg"
                alt=""
                width={20}
                height={20}
                className={headerTab === "test" ? "brightness-0 invert" : ""}
              />
              <span>{t("matingTest.test")}</span>
            </button>
          </div>
        </div>

        {headerTab === "test" ? (
          <div className="mt-8 space-y-6">
            <div className="space-y-2 text-sm font-semibold text-[#82746a] sm:text-base">
              {sourceName ? (
                <p className="text-[#3b2b20]">
                  {isArabic ? "الخيل المرجعي: " : "Reference horse: "}
                  <span className="font-bold">{sourceName}</span>
                </p>
              ) : null}
              {sourceError ? <p className="text-[#b04444]">{sourceError}</p> : null}
              <p className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8b7a6e]" />
                <span>{t("database.matingNoteHeader")}</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8b7a6e]" />
                <span>{t("database.matingNoteSub")}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <SearchHorsePicker
                label={t("database.fatherName")}
                placeholder={isArabic ? "ابحث عن الأب في سجل الخيول" : "Search father in studbook"}
                selected={father}
                onSelect={setFather}
              />
              <SearchHorsePicker
                label={t("database.motherName")}
                placeholder={isArabic ? "ابحث عن الأم في سجل الخيول" : "Search mother in studbook"}
                selected={mother}
                onSelect={setMother}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-[1.8rem] font-bold text-[#20203c]">
                {t("database.matingResult")}
              </h1>
              <button
                type="button"
                onClick={handleRunTestMating}
                disabled={matingLoading}
                className="rounded-2xl bg-[#4a2b1a] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {matingLoading
                  ? isArabic
                    ? "جارٍ التحليل..."
                    : "Analyzing..."
                  : isArabic
                    ? "تشغيل اختبار التزاوج"
                    : "Run test mating"}
              </button>
            </div>

            {matingError ? (
              <div className="rounded-2xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444]">
                {matingError}
              </div>
            ) : null}

            <HorsePedigreeTree
              horse={{ id: String(localHorseId || "test-mating"), name: sourceName || "test-mating" }}
              pedigreeData={matingTree ?? []}
              loading={matingLoading}
              showTitle={false}
              controlsVariant="compact"
            />
          </div>
        ) : canShowAnalysis ? (
          <div className="mt-8 space-y-5">
            <div className={isRTL ? "text-right" : "text-left"}>
              <h1 className="text-[1.8rem] font-bold text-[#20203c]">
                {t("matingTest.title")}
              </h1>
              <p className="mt-2 text-sm font-semibold text-[#7a6c63]">
                {isArabic ? "مرتبطة بالخيل المرجعي: " : "Linked to reference horse: "}
                <span className="text-[#3b2b20]">{sourceName || "-"}</span>
              </p>
            </div>
            <HorseAnalyticsTab studbookId={sourceHorse?.studbookId} />
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
}
