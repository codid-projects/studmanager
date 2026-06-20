"use client";

import { FormEvent, useState } from "react";
import { CalendarDays, HeartPulse } from "lucide-react";
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

export function StallionSoundnessForm({
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
      appendBilledService(data, "Stallion breeding soundness");
      data.set(
        "RecordDate",
        new Date(String(data.get("RecordDate"))).toISOString(),
      );
      await createStallionRecord(locale, "soundness-examinations", data);
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
        {ar ? "فحص تناسلي للفحول" : "Stallion breeding soundness"}
      </h2>
      <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
        <div className="space-y-3">
          <FormSection
            title={ar ? "الفحص السريري" : "Clinical examination"}
            icon={<HeartPulse className="h-4 w-4" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label={ar ? "الخصية اليمنى" : "Right testicle"}>
                <input name="RightTesticleDescription" className={fieldClass} />
              </FormField>
              <FormField label={ar ? "الخصية اليسرى" : "Left testicle"}>
                <input name="LeftTesticleDescription" className={fieldClass} />
              </FormField>
              <FormField label={ar ? "الرغبة الجنسية" : "Libido level"}>
                <select name="LibidoLevel" className={fieldClass}>
                  <option value="1">Low / منخفض</option>
                  <option value="2">Normal / طبيعي</option>
                  <option value="3">High / مرتفع</option>
                </select>
              </FormField>
              <FormField label={ar ? "التوصية النهائية" : "Recommendation"}>
                <select name="Recommendation" className={fieldClass}>
                  <option value="3">Fit for breeding</option>
                  <option value="1">Needs treatment</option>
                  <option value="2">Needs rest</option>
                  <option value="4">Low quality</option>
                </select>
              </FormField>
            </div>
          </FormSection>
          <FormSection title={ar ? "تحليل السائل المنوي" : "Semen analysis"}>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                required
                name="VolumeMl"
                type="number"
                step="0.1"
                placeholder={ar ? "الحجم" : "Volume"}
                className={fieldClass}
              />
              <input
                required
                name="ConcentrationMillionPerMl"
                type="number"
                placeholder={ar ? "التركيز" : "Concentration"}
                className={fieldClass}
              />
              <input
                required
                name="MotilityPercent"
                type="number"
                placeholder={ar ? "الحركة %" : "Motility %"}
                className={fieldClass}
              />
              <input
                required
                name="ProgressiveMotilityPercent"
                type="number"
                placeholder={ar ? "الحركة التقدمية" : "Progressive %"}
                className={fieldClass}
              />
              <input
                required
                name="VigorScore"
                min="1"
                max="5"
                type="number"
                placeholder={ar ? "القوة" : "Vigor"}
                className={fieldClass}
              />
              <select name="StorageType" className={fieldClass}>
                <option value="1">{ar ? "طازج" : "Fresh"}</option>
                <option value="2">{ar ? "مبرد" : "Cooled"}</option>
                <option value="3">{ar ? "مجمد" : "Frozen"}</option>
              </select>
            </div>
          </FormSection>
          <FormSection title={ar ? "ملاحظات إضافية" : "Additional notes"}>
            <textarea
              name="VeterinarianComments"
              rows={4}
              className={`${fieldClass} h-auto py-3`}
            />
          </FormSection>
        </div>
        <div className="space-y-3">
          <FormSection title={ar ? "المعلومات الأساسية" : "Basic information"}>
            <div className="space-y-3">
              <div className="rounded-[7px] bg-[#f5f2ee] p-3 text-xs">
                {ar
                  ? profile.arabicName || profile.englishName
                  : profile.englishName || profile.arabicName}
              </div>
              <FormField
                label={ar ? "تاريخ الفحص" : "Examination date"}
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
                label={ar ? "الطبيب المسؤول" : "Veterinarian"}
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
          <FormSection
            title={ar ? "جدولة الفحص القادم" : "Schedule follow-up"}
            icon={<CalendarDays className="h-4 w-4" />}
            tone="sage"
          >
            <div className="space-y-3">
              <input name="FollowUpDate" type="date" className={fieldClass} />
              <input name="FollowUpNotes" className={fieldClass} />
            </div>
          </FormSection>
        </div>
      </div>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      <BilledServiceFields locale={locale} />
      <FormActions
        locale={locale}
        saving={saving}
        title={ar ? "فحص تناسلي للفحل" : "Stallion soundness"}
      />
    </form>
  );
}
