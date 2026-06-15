"use client";

import { CalendarDays, MapPin, Search, Warehouse } from "lucide-react";
import type { FC } from "react";
import Link from "next/link";
import horsePlaceholder from "@/app/assets/imgs/horse-placehodler.png";

type Props = {
  locale: string;
  direction: "rtl" | "ltr";
  query: string;
  onQueryChange: (v: string) => void;
  horseId?: string | null;
  horseName?: string | null;
};

export const StallionProfileCard: FC<Props> = ({
  locale,
  direction,
  query,
  onQueryChange,
  horseId,
  horseName,
}) => {
  const isRTL = direction === "rtl";
  const horseDisplayName = horseName || (locale === "ar" ? "مداح مهنا" : "Maddah Muhanna");

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#ede3dc] bg-white shadow-[0_14px_40px_rgba(75,47,26,0.055)]">
      <div
        className={`flex flex-col gap-3 border-b border-[#f0e8e2] bg-[#fffdfb] p-4 sm:flex-row sm:items-center sm:p-5 ${
          isRTL ? "sm:flex-row-reverse" : ""
        }`}
      >
        <Link
          href={`/${locale}/horses/${horseId || "1"}`}
          className="order-2 flex h-12 w-full items-center justify-center rounded-[14px] bg-[#4b2f1a] px-6 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(75,47,26,0.16)] transition hover:bg-[#3c2515] sm:order-none sm:w-auto sm:min-w-[190px]"
        >
          {locale === "ar" ? "رؤية الملف الشخصي" : "View profile"}
        </Link>

        <div className="relative w-full min-w-0">
          <span
            className={`absolute top-1/2 -translate-y-1/2 text-[#6f625b] ${
              isRTL ? "right-4" : "left-4"
            }`}
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className={`h-12 w-full rounded-[14px] border border-[#e9ded6] bg-white text-sm text-[#342720] outline-none transition placeholder:text-[#b7a9a0] focus:border-[#8b6b52] focus:ring-4 focus:ring-[#8b6b52]/10 ${
              isRTL ? "pr-11 text-right" : "pl-11 text-left"
            }`}
            placeholder={locale === "ar" ? "ابحث عن الفحل" : "Search stallion"}
          />
        </div>
      </div>

      <div className={`grid gap-6 p-5 sm:p-6 lg:grid-cols-[210px_1fr] ${isRTL ? "lg:[direction:rtl]" : ""}`}>
        <div className="w-full">
          <div className="aspect-[1.08/1] w-full overflow-hidden rounded-[18px] bg-[#f3efeb]">
            <img
              src={horsePlaceholder.src}
              alt={horseDisplayName}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className={`${isRTL ? "text-right" : "text-left"} min-w-0 lg:[direction:inherit]`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#2c211c]">{horseDisplayName}</h2>
              <p className="mt-1 text-sm text-[#9a877b]">
                {locale === "ar" ? "فحل عربي أصيل" : "Purebred Arabian stallion"}
              </p>
            </div>
            <span className="rounded-full bg-[#f5efbb] px-3 py-1.5 text-xs font-bold text-[#594424]">
              {locale === "ar" ? "متاح للتزاوج" : "Available"}
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl bg-[#fbf8f5] p-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6a4a34] shadow-sm">
                <Warehouse className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <div>
                <p className="text-[11px] text-[#a18f84]">{locale === "ar" ? "المزرعة" : "Farm"}</p>
                <p className="mt-0.5 text-sm font-semibold text-[#3e3029]">
                  {locale === "ar" ? "اسم المزرعة" : "Farm name"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-[#fbf8f5] p-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6a4a34] shadow-sm">
                <CalendarDays className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <div>
                <p className="text-[11px] text-[#a18f84]">{locale === "ar" ? "تاريخ الميلاد" : "Date of birth"}</p>
                <p className="mt-0.5 text-sm font-semibold text-[#3e3029]">12-2-2020</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-[#fbf8f5] p-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6a4a34] shadow-sm">
                <MapPin className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <div>
                <p className="text-[11px] text-[#a18f84]">{locale === "ar" ? "الموقع الحالي" : "Current location"}</p>
                <p className="mt-0.5 text-sm font-semibold text-[#3e3029]">
                  {locale === "ar" ? "مصر" : "Egypt"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
