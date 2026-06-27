"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { HealthCategoryTable } from "@/components/health/HealthCategoryTable";
import { InjuryCategoryTable } from "@/components/health/InjuryCategoryTable";
import { CategoryTabs } from "@/components/common/CategoryTabs";
import { HEALTH_CATEGORIES } from "@/lib/section-categories";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslation } from "@/lib/locale-context";

interface HealthCategoryPageProps {
  params: Promise<{
    category: string;
    locale: string;
  }>;
}

function HealthCategoryContent({ category }: { category: string }) {
  const searchParams = useSearchParams();
  const { direction, locale } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === "rtl";
  const isInjuries = category === "injuries";
  const horseIdParam = Number(searchParams.get("horseId"));
  const horseId = Number.isFinite(horseIdParam) && horseIdParam > 0 ? horseIdParam : undefined;
  const horseName = searchParams.get("horseName") ?? undefined;

  return (
    <div className={`p-4 sm:p-6 max-w-[1400px] mx-auto ${isRTL ? "text-right" : "text-left"}`}>
      {/* Back Button */}
      <Link
        href={`/${locale}/health`}
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

      <CategoryTabs section="health" categories={HEALTH_CATEGORIES} activeId={category} />

      {isInjuries ? (
        <InjuryCategoryTable horseId={horseId} horseName={horseName} />
      ) : (
        <HealthCategoryTable categoryId={category} />
      )}
    </div>
  );
}

export default function HealthCategoryPage(props: HealthCategoryPageProps) {
  const params = use(props.params);

  return (
    <MainLayout>
      <Suspense fallback={null}>
        <HealthCategoryContent category={params.category} />
      </Suspense>
    </MainLayout>
  );
}
