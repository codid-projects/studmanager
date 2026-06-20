"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { useLocale } from "@/lib/locale-context";
import Image from "next/image";
import Link from "next/link";

// ===== Categories =====
const EXPENSES_CATEGORIES = [
  {
    id: "breeding",
    labelAr: "التربية والتناسل",
    labelEn: "Breeding",
    icon: "/sidebar/التناسليات.svg",
  },
  {
    id: "clinics",
    labelAr: "العيادات",
    labelEn: "Clinics",
    icon: "/expenses/clinics.svg",
  },
  {
    id: "nutrition",
    labelAr: "التغذية",
    labelEn: "Nutrition",
    icon: "/expenses/nutrition.svg",
  },
];

export default function ExpensesPage() {
  const { locale, direction } = useLocale();
  const isRTL = direction === "rtl";

  return (
    <MainLayout>
      <div
        className={`p-6 max-w-6xl mx-auto space-y-6 ${
          isRTL ? "text-right font-cairo" : "text-left font-inter"
        }`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-10">
          {EXPENSES_CATEGORIES.map((category) => {
            const label = isRTL ? category.labelAr : category.labelEn;

            return (
              <Link
                key={category.id}
                href={`/${locale}/expenses/${category.id}`}
                className="bg-white rounded-[24px] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-4 w-full aspect-square"
              >
                <div className="relative w-16 h-16">
                  <Image
                    src={category.icon}
                    alt={label}
                    fill
                    className="object-contain"
                  />
                </div>

                <span className="text-[#3b2b20] font-bold text-center text-[15px] leading-tight mt-2">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
