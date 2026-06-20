"use client";

import type { LocaleCode } from "@/lib/api/types";
import { fieldClass, FormField, FormSection } from "./FormPrimitives";

export function appendBilledService(data: FormData, serviceType: string) {
  const name = String(data.get("ServiceName") || "").trim();
  const unitPrice = Number(data.get("ServicePrice") || 0);
  data.delete("ServiceName");
  data.delete("ServicePrice");
  if (unitPrice > 0) {
    data.append(
      "BilledServicesJsonList",
      JSON.stringify({
        serviceName: name || serviceType,
        serviceType,
        quantity: 1,
        unitPrice,
      }),
    );
  }
}

export function BilledServiceFields({ locale }: { locale: LocaleCode }) {
  const ar = locale === "ar";
  return (
    <FormSection title={ar ? "تفاصيل التكلفة" : "Cost details"} tone="sage">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label={ar ? "اسم الخدمة" : "Service name"}>
          <input name="ServiceName" className={fieldClass} />
        </FormField>
        <FormField label={ar ? "القيمة بالجنيه المصري" : "Amount (EGP)"}>
          <div className="relative">
            <input
              name="ServicePrice"
              min="0"
              step="any"
              type="number"
              className={`${fieldClass} pe-14`}
            />
            <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#846f62]">
              EGP
            </span>
          </div>
        </FormField>
      </div>
    </FormSection>
  );
}
