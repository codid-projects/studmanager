"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { LedgerTransactions } from "@/components/finance/LedgerTransactions";
import { CategoryTabs } from "@/components/common/CategoryTabs";
import { EXPENSES_CATEGORIES } from "@/lib/section-categories";
import { useLocale, useTranslation } from "@/lib/locale-context";

interface ExpensesCategoryPageProps {
  params: Promise<{
    category: string;
    locale: string;
  }>;
}

export default function ExpensesCategoryPage(props: ExpensesCategoryPageProps) {
  const params = use(props.params);
  const { direction, locale } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === "rtl";

  return (
    <MainLayout>
      <div
        className={`p-6 max-w-[1400px] mx-auto ${isRTL ? "text-right font-cairo" : "text-left font-inter"}`}
      >
        <Link
          href={`/${locale}/expenses`}
          className="inline-flex items-center gap-2 mb-6 font-bold text-[#b4987a] hover:text-[#91765c] transition-colors"
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

        <CategoryTabs section="expenses" categories={EXPENSES_CATEGORIES} activeId={params.category} />

        <LedgerTransactions
          direction="expense"
          category={params.category === "clinics" ? "health" : params.category}
        />
      </div>
    </MainLayout>
  );
}
