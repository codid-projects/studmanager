"use client";

import { FormEvent, useState } from "react";
import { FlaskConical, MapPin, Truck } from "lucide-react";
import type { LocaleCode } from "@/lib/api/types";
import type { BreedingProfile } from "@/lib/api/mare-breeding-client";
import { createStallionRecord } from "@/lib/api/stallion-breeding-client";
import {
  fieldClass,
  FormActions,
  FormField,
  FormSection,
} from "../shared/FormPrimitives";
import {
  appendBilledService,
  BilledServiceFields,
} from "../shared/BilledServiceFields";

export function SemenShipmentForm({
  locale,
  profile,
  onSaved,
}: {
  locale: LocaleCode;
  profile: BreedingProfile;
  onSaved: () => void;
}) {
  const ar = locale === "ar";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setError("");
    const data = new FormData(form);
    try {
      data.set("ProfileId", String(profile.profileId));
      appendBilledService(data, "Semen shipment");
      data.set(
        "RecordDate",
        new Date(String(data.get("RecordDate"))).toISOString(),
      );
      await createStallionRecord(locale, "semen-shipments", data);
      form.reset();
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed");
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={submit} className="rounded-[10px] bg-white p-4">
      <h2 className="mb-5 text-[17px]">
        {ar ? "إنشاء شحنة سائل منوي جديدة" : "Create semen shipment"}
      </h2>
      <div className="grid gap-3 lg:grid-cols-[170px_1fr]">
        <aside className="space-y-3">
          <FormSection
            title={ar ? "الدفع والتسليم" : "Delivery details"}
            icon={<Truck className="h-4 w-4" />}
          >
            <div className="space-y-3">
              <FormField label={ar ? "المحطة / المدينة" : "Destination"}>
                <input name="Destination" className={fieldClass} />
              </FormField>
              <FormField label={ar ? "المدينة" : "City"}>
                <input name="City" className={fieldClass} />
              </FormField>
              <FormField label={ar ? "اسم المستلم" : "Recipient"}>
                <input name="RecipientName" className={fieldClass} />
              </FormField>
              <FormField label={ar ? "اسم العميل" : "Customer"}>
                <input name="CustomerName" className={fieldClass} />
              </FormField>
            </div>
          </FormSection>
          <FormSection
            title={ar ? "موقع المحطة" : "Destination map"}
            icon={<MapPin className="h-4 w-4" />}
            tone="sage"
          >
            <div className="grid grid-cols-2 gap-2">
              <input
                name="Latitude"
                placeholder="Latitude"
                className={fieldClass}
              />
              <input
                name="Longitude"
                placeholder="Longitude"
                className={fieldClass}
              />
            </div>
          </FormSection>
        </aside>
        <div className="space-y-3">
          <FormSection title={ar ? "المعلومات الأساسية" : "Basic information"}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label={ar ? "اسم الفحل" : "Stallion"}>
                <div className={`${fieldClass} flex items-center`}>
                  {ar
                    ? profile.arabicName || profile.englishName
                    : profile.englishName || profile.arabicName}
                </div>
              </FormField>
              <FormField
                label={ar ? "تاريخ بداية الشحنة" : "Shipment date"}
                required
              >
                <input
                  required
                  name="RecordDate"
                  type="datetime-local"
                  className={fieldClass}
                />
              </FormField>
              <FormField
                label={ar ? "الطبيب / المسؤول" : "Responsible person"}
                required
              >
                <input
                  required
                  name="VeterinarianName"
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "حالة الشحنة" : "Shipment status"}>
                <select name="Status" className={fieldClass}>
                  <option value="1">Preparing</option>
                  <option value="2">Scheduled</option>
                  <option value="3">Urgent</option>
                </select>
              </FormField>
            </div>
          </FormSection>
          <FormSection
            title={ar ? "التفاصيل الفنية" : "Technical details"}
            icon={<FlaskConical className="h-4 w-4" />}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label={ar ? "التركيز" : "Concentration"}>
                <input
                  required
                  name="Concentration"
                  type="number"
                  step="0.1"
                  className={fieldClass}
                />
              </FormField>
              <FormField
                label={ar ? "الحركة التقدمية %" : "Progressive motility %"}
              >
                <input
                  required
                  name="ProgressiveMotility"
                  type="number"
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "نوع التخزين" : "Storage"}>
                <select name="StorageType" className={fieldClass}>
                  <option value="1">{ar ? "طازج" : "Fresh"}</option>
                  <option value="2">{ar ? "مبرد" : "Cooled"}</option>
                  <option value="3">{ar ? "مجمد" : "Frozen"}</option>
                </select>
              </FormField>
            </div>
          </FormSection>
          <FormSection title={ar ? "ملاحظات خاصة" : "Special notes"}>
            <textarea
              name="VeterinarianComments"
              rows={4}
              className={`${fieldClass} h-auto py-3`}
            />
          </FormSection>
        </div>
      </div>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      <BilledServiceFields locale={locale} />
      <FormActions
        locale={locale}
        saving={saving}
        title={ar ? "شحنة سائل منوي جديدة" : "New semen shipment"}
      />
    </form>
  );
}
