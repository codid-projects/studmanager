"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Eye, LoaderCircle, Search } from "lucide-react";
import horsePlaceholder from "@/app/assets/imgs/horse-placehodler.png";
import type { HorseListItemDto, LocaleCode } from "@/lib/api/types";
import type { BreedingProfile } from "@/lib/api/mare-breeding-client";
import { BreedingHorsePickerModal } from "./BreedingHorsePickerModal";

export function BreedingHorseCard({
  locale,
  onSelect,
  profile,
  loading,
  gender,
}: {
  locale: LocaleCode;
  onSelect: (horse: HorseListItemDto) => void;
  profile: BreedingProfile | null;
  loading: boolean;
  gender: "Female" | "Male";
}) {
  const ar = locale === "ar";
  const [pickerOpen, setPickerOpen] = useState(false);
  const closePicker = useCallback(() => setPickerOpen(false), []);
  const label = ar
    ? `اختر ${gender === "Female" ? "الفرس" : "الفحل"}`
    : `Select ${gender === "Female" ? "mare" : "stallion"}`;
  const selectedName = profile
    ? ar
      ? profile.arabicName || profile.englishName
      : profile.englishName || profile.arabicName
    : null;
  const pickerLabel = selectedName
    ? `${ar ? "تغيير" : "Change"} ${gender === "Female" ? (ar ? "الفرس" : "mare") : ar ? "الفحل" : "stallion"} · ${selectedName}`
    : label;

  return (
    <>
      <section className="overflow-hidden rounded-[10px] bg-white p-3 shadow-[0_1px_2px_rgba(62,38,23,.04)]">
        <div className="flex items-center gap-3">
          {profile && (
            <Link
              href={`/${locale}/horses/${profile.horseId}`}
              className="flex h-10 shrink-0 items-center gap-2 rounded-[9px] bg-[#351d10] px-4 text-[12px] font-semibold text-white"
            >
              <Eye className="h-4 w-4" />
              {ar ? "رؤية الملف الشخصي" : "View profile"}
            </Link>
          )}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className={`flex items-center justify-center gap-2 rounded-[9px] border text-[#4a3021] shadow-sm transition hover:border-[#351d10] hover:bg-[#f6ece5] ${profile ? "h-11 flex-1 border-[#bda99b] bg-[#fbf3ed] px-4 text-[12px] font-bold" : "h-24 w-full border-[#8f8580] bg-white text-xl font-bold"}`}
          >
            <Search className={profile ? "h-4 w-4 shrink-0" : "h-6 w-6"} />
            <span className="truncate">{pickerLabel}</span>
          </button>
        </div>
        {loading && !profile && (
          <div className="grid h-28 place-items-center">
            <LoaderCircle className="h-6 w-6 animate-spin text-[#351d10]" />
          </div>
        )}
        {profile && (
          <div className="mt-3 grid grid-cols-[1fr_108px] gap-5 px-2 pb-1">
            <div className="grid content-center gap-2 text-[12px] text-[#7f7671] sm:grid-cols-2">
              <p>
                <b className="ms-2 text-[#352a25]">{ar ? "الاسم" : "Name"}</b>:{" "}
                {ar
                  ? profile.arabicName || profile.englishName
                  : profile.englishName || profile.arabicName}
              </p>
              <p>
                <b className="ms-2 text-[#352a25]">{ar ? "المزرعة" : "Farm"}</b>
                :{" "}
                {ar
                  ? profile.ownerAR || profile.ownerEN
                  : profile.ownerEN || profile.ownerAR}
              </p>
              <p>
                <b className="ms-2 text-[#352a25]">
                  {ar ? "تاريخ الميلاد" : "Date of birth"}
                </b>
                :{" "}
                {profile.dateofBirth
                  ? new Date(profile.dateofBirth).toLocaleDateString(
                      ar ? "ar-EG" : "en-GB",
                    )
                  : "—"}
              </p>
              <p>
                <b className="ms-2 text-[#352a25]">{ar ? "اللون" : "Color"}</b>:{" "}
                {profile.color || "—"}
              </p>
            </div>
            <img
              src={profile.horseProfileImage || horsePlaceholder.src}
              alt=""
              className="h-[108px] w-[108px] rounded-[10px] object-cover"
            />
          </div>
        )}
      </section>
      <BreedingHorsePickerModal
        open={pickerOpen}
        locale={locale}
        gender={gender}
        onClose={closePicker}
        onSelect={onSelect}
      />
    </>
  );
}
