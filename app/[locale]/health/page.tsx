"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { useLocale } from "@/lib/locale-context";
import { HEALTH_CATEGORIES } from "@/lib/section-categories";
import Link from "next/link";
import Image from "next/image";

export default function HealthDashboardPage() {
  const { locale, direction } = useLocale();
  const isRTL = direction === "rtl";

  return (
    <MainLayout>
      <div className={`p-6 max-w-6xl mx-auto space-y-6 ${isRTL ? "text-right font-cairo" : "text-left font-inter"}`}>
        
        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 justify-items-center mt-10">
          {HEALTH_CATEGORIES.map((category) => {
            const label = isRTL ? category.labelAr : category.labelEn;
            return (
              <Link 
                key={category.id} 
                href={`/${locale}/health/${category.id}`}
                className="bg-white rounded-[24px] p-4 sm:p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-4 w-full aspect-square"
              >
                <div className="relative w-12 h-12 sm:w-16 sm:h-16">
                  <Image 
                    src={category.icon} 
                    alt={label} 
                    fill 
                    className="object-contain"
                  />
                </div>
                <span className="text-[#3b2b20] font-bold text-center text-[13px] sm:text-[15px] leading-tight mt-2 line-clamp-2">
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
