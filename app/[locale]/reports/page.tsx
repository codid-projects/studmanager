"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { useLocale } from "@/lib/locale-context";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";

export default function ReportsPage() {
  const { direction } = useLocale();
  const isRTL = direction === "rtl";

  return (
    <MainLayout>
      <div
        className={`mx-auto max-w-[1400px] p-4 sm:p-6 ${isRTL ? "text-right font-cairo" : "text-left"}`}
        dir={direction}
      >
        <ReportsDashboard />
      </div>
    </MainLayout>
  );
}
