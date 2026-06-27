"use client";

import { use } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PerformanceCategoryTable } from "@/components/performance/PerformanceCategoryTable";
import { CategoryTabs } from "@/components/common/CategoryTabs";
import { PERFORMANCE_CATEGORIES } from "@/lib/section-categories";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslation } from "@/lib/locale-context";

interface PerformanceCategoryPageProps {
  params: Promise<{
    category: string;
    locale: string;
  }>;
}

export default function PerformanceCategoryPage(props: PerformanceCategoryPageProps) {
  const params = use(props.params);
  const { direction, locale } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === "rtl";

  return (
    <MainLayout>
      <div className={`p-6 max-w-[1400px] mx-auto ${isRTL ? "text-right" : "text-left"}`}>
        <Link
          href={`/${locale}/performance`}
          className="inline-flex items-center gap-2 mb-6 font-bold text-[#b4987a] hover:text-[#91765c] transition-colors font-cairo"
        >
          {isRTL ? (
            <>
              {t("common.back")}
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              {t("common.back")}
            </>
          )}
        </Link>
        <CategoryTabs section="performance" categories={PERFORMANCE_CATEGORIES} activeId={params.category} />
        <PerformanceCategoryTable categoryId={params.category} />
      </div>
    </MainLayout>
  );
}
