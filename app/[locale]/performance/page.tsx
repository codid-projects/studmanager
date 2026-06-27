"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { useLocale } from "@/lib/locale-context";
import { PERFORMANCE_CATEGORIES } from "@/lib/section-categories";
import Link from "next/link";
import Image from "next/image";

export default function PerformanceDashboardPage() {
  const { locale, direction } = useLocale();
  const isRTL = direction === "rtl";

  return (
    <MainLayout>
      <div className={`p-6 max-w-6xl mx-auto space-y-6 ${isRTL ? "text-right font-cairo" : "text-left font-inter"}`}>
        
        {/* Categories Grid */}
        <div className="mt-10 grid grid-cols-2 justify-items-center gap-4 sm:gap-6 md:grid-cols-3">
          {PERFORMANCE_CATEGORIES.map((category) => {
            const label = isRTL ? category.labelAr : category.labelEn;
            const isLastOddMobileCard =
              PERFORMANCE_CATEGORIES.length % 2 === 1 &&
              PERFORMANCE_CATEGORIES.length > 1 &&
              category.id === PERFORMANCE_CATEGORIES[PERFORMANCE_CATEGORIES.length - 1].id;

            return (
              <Link 
                key={category.id} 
                href={`/${locale}/performance/${category.id}`}
                className={`flex h-[180px] w-full max-w-[180px] flex-col items-center justify-center gap-4 rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md ${
                  isLastOddMobileCard ? "col-span-2 md:col-span-1" : ""
                }`}
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
