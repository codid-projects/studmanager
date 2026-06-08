"use client";

import { FC, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useLocale } from "@/lib/locale-context";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import horsePlaceholder from "@/app/assets/imgs/horse-placehodler.png";
import { BadgeCheck, CircleDollarSign, HeartPulse, Pencil, QrCode, X } from "lucide-react";

interface Horse {
  id: string;
  studbookId?: number | null;
  nameAr: string;
  nameEn: string;
  type: string;
  gender: string;
  birthDate: string;
  features: number;
  image: string;
  raw?: Record<string, any>;
}

interface HorseProfileHeaderProps {
  horse: Horse;
  onEdit?: () => void;
  fatherName?: string;
  motherName?: string;
}

export const HorseProfileHeader: FC<HorseProfileHeaderProps> = ({ horse, onEdit, fatherName: pedigreeFatherName, motherName: pedigreeMotherName }) => {
  const { locale, direction, t } = useLocale();
  const isRTL = direction === "rtl";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [coverSrc, setCoverSrc] = useState<string | typeof horsePlaceholder>(
    horse.image || horsePlaceholder,
  );
  const [avatarSrc, setAvatarSrc] = useState<string | typeof horsePlaceholder>(
    horse.image || horsePlaceholder,
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryMode, setSummaryMode] = useState<"qr" | "summary">("summary");
  const [isSold, setIsSold] = useState(false);

  const horseName = locale === "ar" ? horse.nameAr : horse.nameEn;
  const raw = horse.raw ?? {};
  const rawStudbookId = raw.studbookId ?? raw.StudbookId;
  const studbookId =
    typeof horse.studbookId === "number"
      ? horse.studbookId
      : typeof rawStudbookId === "number"
        ? rawStudbookId
        : Number(rawStudbookId) || null;
  const hasStudbookId = Boolean(studbookId);
  const cleanValue = (value?: string | null) => {
    const next = typeof value === "string" ? value.trim() : "";
    return next && next.toLowerCase() !== "null" && next.toLowerCase() !== "undefined" ? next : "";
  };
  const localized = (ar?: string | null, en?: string | null) =>
    locale === "ar" ? cleanValue(ar) || cleanValue(en) || "-" : cleanValue(en) || cleanValue(ar) || "-";
  const fatherName = cleanValue(pedigreeFatherName) || localized(
    raw.horseFatherArabicName ?? raw.fatherArabicName ?? raw.sireArabicName,
    raw.horseFatherEnglishName ?? raw.fatherEnglishName ?? raw.sireEnglishName,
  );
  const motherName = cleanValue(pedigreeMotherName) || localized(
    raw.horseMotherArabicName ?? raw.motherArabicName ?? raw.damArabicName,
    raw.horseMotherEnglishName ?? raw.motherEnglishName ?? raw.damEnglishName,
  );
  const strain = localized(raw.strainAr, raw.strainEn);
  const summaryUrl = useMemo(
    () => (studbookId ? `https://studbook-web-next-js.vercel.app/horses/${studbookId}` : ""),
    [studbookId],
  );
  const qrImageUrl = summaryUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(summaryUrl)}`
    : "";
  const normalizedGender = String(horse.gender).toLowerCase();
  const reproductionTab =
    normalizedGender.includes("female") ||
    normalizedGender.includes("mare") ||
    normalizedGender.includes("filly")
      ? "mares"
      : "stallions";
  const reproductionUrl =
    `/${locale}/reproduction?tab=${reproductionTab}` +
    `&horseId=${encodeURIComponent(horse.id)}` +
    `&horseName=${encodeURIComponent(horseName)}`;

  useEffect(() => {
    if (searchParams.get("horseSummary") === "1") {
      setSummaryMode("summary");
      setSummaryOpen(true);
    }
  }, [searchParams]);

  const closeSummary = () => {
    setSummaryOpen(false);
    if (searchParams.get("horseSummary") === "1") {
      router.replace(pathname, { scroll: false });
    }
  };

  return (
    <div className="mb-8">
      {/* Cover Image & Avatar Container */}
      <div className="relative mb-16">
        {/* Cover */}
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="relative h-80 w-full overflow-hidden rounded-3xl shadow-sm"
          aria-label={isRTL ? "عرض صورة الخيل" : "Preview horse image"}
        >
          <Image
            src={coverSrc}
            alt={horseName}
            fill
            className="object-cover transition duration-300 hover:scale-[1.02]"
            onError={() => setCoverSrc(horsePlaceholder)}
          />
        </button>

        {/* Avatar overlapping the bottom edge */}
        <div className={`absolute -bottom-16 ${isRTL ? "right-12" : "left-12"} w-40 h-40 rounded-full border-4 border-[#fdfbf7] overflow-hidden bg-white shadow-md z-10`}>
          <Image
            src={avatarSrc}
            alt={horseName}
            fill
            className="object-cover"
            onError={() => setAvatarSrc(horsePlaceholder)}
          />
        </div>
      </div>

      {previewOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewOpen(false)}>
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label={isRTL ? "إغلاق" : "Close"}
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative h-[80vh] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <Image
              src={coverSrc}
              alt={horseName}
              fill
              className="object-contain"
              onError={() => setCoverSrc(horsePlaceholder)}
            />
          </div>
        </div>
      ) : null}

      {/* Info Context Below Cover */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center px-4 md:px-12`}>
        {/* Name Area */}
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl md:text-4xl font-bold text-[#2a2a2a]">
            {horseName}
          </h1>
        </div>

        {/* Action Area */}
        <div className={`flex flex-wrap items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <button
            type="button"
            onClick={() => router.push(reproductionUrl)}
            className="flex h-12 items-center gap-2 rounded-xl border border-[#d9c9bd] bg-white px-4 font-semibold text-[#3d2a1b] transition-colors hover:bg-[#fbf8f4]"
          >
            <HeartPulse className="h-5 w-5" />
            <span>{t("horses.reproductionProfile")}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSold((current) => !current)}
            className={`flex h-12 items-center gap-2 rounded-xl border px-4 font-semibold transition-colors ${
              isSold
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-[#d9c9bd] bg-white text-[#3d2a1b] hover:bg-[#fbf8f4]"
            }`}
            title={t("horses.soldLocalOnly")}
          >
            {isSold ? <BadgeCheck className="h-5 w-5" /> : <CircleDollarSign className="h-5 w-5" />}
            <span>{isSold ? t("horses.sold") : t("horses.markAsSold")}</span>
          </button>

          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="flex h-12 items-center gap-2 rounded-xl border border-[#d9c9bd] bg-white px-4 text-[#3d2a1b] transition-colors hover:bg-[#fbf8f4] font-semibold"
              aria-label={isRTL ? "تعديل الخيل" : "Edit horse"}
            >
              <Pencil className="h-5 w-5" />
              <span>{isRTL ? "تعديل" : "Edit"}</span>
            </button>
          ) : null}

          {hasStudbookId ? (
            <button
              type="button"
              onClick={() => {
                setSummaryMode("qr");
                setSummaryOpen(true);
              }}
              className="flex h-12 items-center gap-2 rounded-xl border border-[#d9c9bd] bg-white px-4 text-[#3d2a1b] transition-colors hover:bg-[#fbf8f4] font-semibold"
              aria-label={isRTL ? "رمز QR" : "QR code"}
            >
              <QrCode className="h-5 w-5" />
              <span>{isRTL ? "QR" : "QR"}</span>
            </button>
          ) : null}

          <button
            onClick={() => router.push(`/${locale}/horses/${horse.id}/mating-test`)}
            className="flex h-12 items-center gap-2 px-5 bg-[#3d2a1b] text-white rounded-xl hover:bg-[#2c1f14] transition-colors font-semibold"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="14" r="5" />
              <line x1="14" y1="10" x2="19" y2="5" />
              <line x1="15" y1="5" x2="19" y2="5" />
              <line x1="19" y1="9" x2="19" y2="5" />
            </svg>
            <span>{isRTL ? "إختبار التزاوج" : "Mating Test"}</span>
          </button>
        </div>
      </div>

      {summaryOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4" onClick={closeSummary}>
          <div
            dir={direction}
            className="w-full max-w-md rounded-[24px] bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-[#2b1a12]">
                {isRTL ? "ملخص الخيل" : "Horse Summary"}
              </h3>
              <button
                type="button"
                onClick={closeSummary}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7f1eb] text-[#3b2b20]"
                aria-label={isRTL ? "إغلاق" : "Close"}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-4">
              {summaryMode === "qr" && qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt={isRTL ? "رمز QR لملف الخيل" : "Horse profile QR code"}
                  className="h-56 w-56 rounded-2xl border border-[#eadfd9] bg-white p-3"
                />
              ) : null}

              <div className="w-full rounded-2xl bg-[#fbf8f4] p-4 text-sm">
                {[
                  [isRTL ? "الاسم" : "Name", horseName],
                  [isRTL ? "تاريخ الميلاد" : "Date of Birth", horse.birthDate || "-"],
                  [isRTL ? "الرسن" : "Strain", strain],
                  [isRTL ? "الأب" : "Father", fatherName],
                  [isRTL ? "الأم" : "Mother", motherName],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 border-b border-[#eadfd9] py-2 last:border-b-0">
                    <span className="font-semibold text-[#7a6c63]">{label}</span>
                    <span className="min-w-0 truncate font-bold text-[#2b1a12]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
