"use client";

import { Suspense } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ReproductionPageContent } from "@/components/reproduction/ReproductionPageContent";

export default function ReproductionPage() {
  return (
    <MainLayout>
      <Suspense fallback={null}>
        <ReproductionPageContent />
      </Suspense>
    </MainLayout>
  );
}
