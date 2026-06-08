"use client";

import { Search } from "lucide-react";
import type { FC } from "react";
import Link from "next/link";

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

  return (
    <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-6">
      <div
        className={`flex flex-col sm:flex-row sm:items-center gap-3 ${
          isRTL ? "sm:flex-row-reverse" : ""
        }`}
      >
        <Link
          href={`/${locale}/horses/${horseId || "1"}`}
          className="flex h-11 w-full items-center justify-center rounded-2xl bg-[#4b2f1a] px-4 text-sm font-semibold text-white sm:w-auto sm:min-w-[220px]"
        >
          {locale === "ar" ? "رؤية الملف الشخصي" : "View profile"}
        </Link>

        <div className="relative w-full">
          <span
            className={`absolute top-1/2 -translate-y-1/2 text-[#6f625b] ${
              isRTL ? "right-4" : "left-4"
            }`}
          >
            <Search className="h-4 w-4" />
          </span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className={`w-full h-11 rounded-2xl border border-[#ece2da] bg-white text-sm outline-none ${
              isRTL ? "pr-10 text-right" : "pl-10 text-left"
            }`}
            placeholder={locale === "ar" ? "اختر الفرس" : "Search mare"}
          />
        </div>
      </div>

      <div className="mt-6 flex gap-6 items-start">
        {/* image */}
        <div className="w-full lg:w-[220px]">
          <div className="w-full aspect-[2/2] rounded-2xl overflow-hidden bg-[#f3f1ef]">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfquc1pFNFujzgkuv6_xka95bqkKHoR4jE5w&s"
              alt="mare"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        {/* details */}
        <div className={`${isRTL ? "text-right" : "text-left"}`}>
          <div className=" gap-y-3 gap-x-8 text-sm">
            <div className="flex gap-2 mb-5">
              <span className="font-bold text-[#2c2330]">
                {locale === "ar" ? "الاسم" : "Name"} :
              </span>
              <span className="text-[#5f525a]">
                {horseName || (locale === "ar" ? "اسم" : "Name")}
              </span>
            </div>

            <div className="flex gap-2 mb-5">
              <span className="font-bold text-[#2c2330]">
                {locale === "ar" ? "المزرعة" : "Farm"} :
              </span>
              <span className="text-[#5f525a]">
                {locale === "ar" ? "اسم المزرعة" : "Farm name"}
              </span>
            </div>

            <div className="flex gap-2 mb-5">
              <span className="font-bold text-[#2c2330]">
                {locale === "ar" ? "تاريخ الميلاد" : "DOB"} :
              </span>
              <span className="text-[#5f525a]">12-2-2020</span>
            </div>

            <div className="flex gap-2 mb-5">
              <span className="font-bold text-[#2c2330]">
                {locale === "ar" ? "ولد في" : "Born in"} :
              </span>
              <span className="text-[#5f525a]">
                {locale === "ar" ? "مصر" : "Egypt"}
              </span>
            </div>

            <div className="flex gap-2 mb-5">
              <span className="font-bold text-[#2c2330]">
                {locale === "ar" ? "حاليا في" : "Currently in"} :
              </span>
              <span className="text-[#5f525a]">
                {locale === "ar"
                  ? "الفرس حاليا في مصر"
                  : "The mare is currently in Egypt"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
