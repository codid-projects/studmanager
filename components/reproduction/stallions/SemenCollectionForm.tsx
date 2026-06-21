"use client";

import { FormEvent, useState } from "react";
import { FlaskConical, Leaf, Thermometer } from "lucide-react";
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

export function SemenCollectionForm({
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
      appendBilledService(data, "Semen collection");
      data.set(
        "RecordDate",
        new Date(String(data.get("RecordDate"))).toISOString(),
      );
      await createStallionRecord(locale, "semen-collections", data);
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
      <h2 className="mb-1 text-[17px]">
        {ar ? "جمع سائل منوي جديد" : "New semen collection"}
      </h2>
      <p className="mb-5 text-[10px] text-[#8a7d76]">
        {ar
          ? "تسجيل بيانات الجمع والتقييم المعملي"
          : "Collection and laboratory evaluation"}
      </p>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <FormSection
            title={
              ar
                ? "التقييم العياني والمجهري"
                : "Macroscopic & microscopic evaluation"
            }
            icon={<FlaskConical className="h-4 w-4" />}
          >
            <div className="grid gap-3 sm:grid-cols-4">
              <FormField label={ar ? "الحجم (مل)" : "Volume (ml)"}>
                <input
                  required
                  name="VolumeMl"
                  type="number"
                  step="0.1"
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "التركيز" : "Concentration"}>
                <input
                  required
                  name="ConcentrationMillionPerMl"
                  type="number"
                  step="0.1"
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "الحركة الكلية %" : "Motility %"}>
                <input
                  required
                  name="MotilityPercent"
                  type="number"
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "الحركة التقدمية %" : "Progressive %"}>
                <input
                  required
                  name="ProgressiveMotilityPercent"
                  type="number"
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "القوة (1-5)" : "Vigor (1-5)"}>
                <input
                  required
                  name="VigorScore"
                  min="1"
                  max="5"
                  type="number"
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "الشكل الطبيعي %" : "Morphology %"}>
                <input
                  required
                  name="MorphologyPercent"
                  type="number"
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "الجرعات الناتجة" : "Resulting doses"}>
                <input
                  required
                  name="ResultingDoses"
                  type="number"
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "المظهر" : "Appearance"}>
                <select name="Appearance" className={fieldClass}>
                  <option value="1">
                    {ar ? "أبيض حليبي" : "Milky white"}
                  </option>
                  <option value="2">{ar ? "مُصفر" : "Yellowish"}</option>
                  <option value="3">{ar ? "مائي" : "Watery"}</option>
                </select>
              </FormField>
            </div>
          </FormSection>
          <FormSection
            title={ar ? "العوامل البيئية" : "Environment"}
            icon={<Thermometer className="h-4 w-4" />}
            tone="sage"
          >
            <div className="grid grid-cols-2 gap-3">
              <FormField label={ar ? "درجة الحرارة" : "Temperature °C"}>
                <input
                  name="TemperatureC"
                  type="number"
                  step="0.1"
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "الرطوبة %" : "Humidity %"}>
                <input
                  name="HumidityPercent"
                  type="number"
                  className={fieldClass}
                />
              </FormField>
            </div>
          </FormSection>
          <FormSection title={ar ? "ملاحظات المختبر" : "Lab notes"}>
            <textarea
              name="VeterinarianComments"
              rows={3}
              className={`${fieldClass} h-auto py-3`}
            />
          </FormSection>
        </div>
        <div className="space-y-3">
          <FormSection
            title={ar ? "معلومات الفحل" : "Stallion information"}
            icon={<Leaf className="h-4 w-4" />}
          >
            <div className="space-y-3">
              <div className="rounded-[7px] bg-[#f6f2ed] p-3 text-[11px]">
                {ar
                  ? profile.arabicName || profile.englishName
                  : profile.englishName || profile.arabicName}
              </div>
              <FormField
                label={ar ? "التاريخ والوقت" : "Date and time"}
                required
              >
                <input
                  required
                  name="RecordDate"
                  type="datetime-local"
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "طريقة الجمع" : "Collection method"}>
                <select name="CollectionMethod" className={fieldClass}>
                  <option value="1">
                    {ar ? "المهبل الصناعي" : "Artificial vagina"}
                  </option>
                  <option value="2">{ar ? "يدوي" : "Manual"}</option>
                  <option value="3">{ar ? "أخرى" : "Other"}</option>
                </select>
              </FormField>
              <FormField
                label={ar ? "المسؤول عن الجمع" : "Responsible veterinarian"}
                required
              >
                <input
                  required
                  name="VeterinarianName"
                  className={fieldClass}
                />
              </FormField>
            </div>
          </FormSection>
          <FormSection title={ar ? "نوع التخزين" : "Storage type"}>
            <select name="StorageType" className={fieldClass}>
              <option value="1">{ar ? "طازج" : "Fresh"}</option>
              <option value="2">{ar ? "مبرد 4°م" : "Cooled 4°C"}</option>
              <option value="3">{ar ? "مجمد -196°م" : "Frozen -196°C"}</option>
            </select>
            <input type="hidden" name="PowerScore" value="1" />
          </FormSection>
        </div>
      </div>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      <BilledServiceFields locale={locale} />
      <FormActions
        locale={locale}
        saving={saving}
        title={ar ? "جمع سائل منوي جديد" : "New semen collection"}
      />
    </form>
  );
}
