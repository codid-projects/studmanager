"use client";

import { useState } from "react";
import { LedgerTransactions } from "@/components/finance/LedgerTransactions";
import { MainLayout } from "@/components/layout/MainLayout";
import { useLocale } from "@/lib/locale-context";

const categories = [
  { id: "breeding", ar: "التربية والتناسل", en: "Breeding" },
  { id: "health", ar: "الرعاية الصحية", en: "Healthcare" },
  { id: "nutrition", ar: "التغذية", en: "Nutrition" },
];

export default function RevenuePage() {
  const { locale } = useLocale();
  const ar = locale !== "en";
  const [category, setCategory] = useState("breeding");
  return (
    <MainLayout>
      <div className="mx-auto min-h-screen max-w-[1400px] space-y-4 p-4 sm:p-6">
        <nav className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item.id}
              onClick={() => setCategory(item.id)}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold ${category === item.id ? "border-[#351d10] bg-[#351d10] text-white" : "bg-white text-[#4b3020]"}`}
            >
              {ar ? item.ar : item.en}
            </button>
          ))}
        </nav>
        <LedgerTransactions direction="revenue" category={category} />
      </div>
    </MainLayout>
  );
}
