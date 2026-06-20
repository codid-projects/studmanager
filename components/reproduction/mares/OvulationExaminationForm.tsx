"use client";

import { FormEvent, useState } from "react";
import { CalendarDays, FlaskConical, HeartPulse } from "lucide-react";
import type { LocaleCode } from "@/lib/api/types";
import {
  createExamination,
  type BreedingProfile,
} from "@/lib/api/mare-breeding-client";
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

export function OvulationExaminationForm({
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
      appendBilledService(data, "Ovulation examination");
      data.set(
        "RecordDate",
        new Date(String(data.get("RecordDate"))).toISOString(),
      );
      await createExamination(locale, "ovulation", data);
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
      <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
        <div className="space-y-3">
          <FormSection
            title={ar ? "النتائج الإكلينيكية" : "Clinical results"}
            icon={<FlaskConical className="h-4 w-4" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label={ar ? "المبيض الأيمن (مم)" : "Right ovary (mm)"}>
                <input
                  name="RightOvarySizeMm"
                  type="number"
                  step="0.1"
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "المبيض الأيسر (مم)" : "Left ovary (mm)"}>
                <input
                  name="LeftOvarySizeMm"
                  type="number"
                  step="0.1"
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "الوذمة" : "Edema"}>
                <select name="EdemaGrade" className={fieldClass}>
                  <option value="0">None / لا يوجد</option>
                  <option value="1">Mild / خفيف</option>
                  <option value="2">Moderate / متوسط</option>
                  <option value="3">Severe / شديد</option>
                </select>
              </FormField>
              <FormField label={ar ? "عنق الرحم" : "Cervix"}>
                <select name="CervicalStatus" className={fieldClass}>
                  <option value="1">Closed / مغلق</option>
                  <option value="2">Partially open</option>
                  <option value="3">Open / مفتوح</option>
                </select>
              </FormField>
              <FormField label={ar ? "الرحم" : "Uterus"}>
                <input name="UterineNotes" className={fieldClass} />
              </FormField>
              <FormField label={ar ? "المهبل" : "Vaginal status"}>
                <input name="VaginalStatus" className={fieldClass} />
              </FormField>
              <FormField
                label={ar ? "تعليقات الطبيب" : "Veterinarian comments"}
                className="sm:col-span-2"
              >
                <textarea
                  name="VeterinarianComments"
                  rows={3}
                  className={`${fieldClass} h-auto py-3`}
                />
              </FormField>
            </div>
          </FormSection>
          <FormSection
            title={ar ? "حالة الفحص" : "Examination results"}
            icon={<HeartPulse className="h-4 w-4" />}
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                [3, "Pregnant / حامل"],
                [2, "Empty / فارغة"],
                [6, "Aborted / إجهاض"],
                [4, "Twins / توأم"],
                [1, "Normal / طبيعي"],
                [5, "Resorbing / امتصاص"],
                [7, "Vulvoplasty / تجميل"],
              ].map(([value, label]) => (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    required
                    name="ClinicalResult"
                    value={value}
                    className="peer sr-only"
                  />
                  <span className="grid min-h-14 place-items-center rounded-[7px] bg-[#f5f2ec] p-2 text-center text-[10px] peer-checked:bg-[#351d10] peer-checked:text-white">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </FormSection>
        </div>
        <div className="space-y-3">
          <FormSection title={ar ? "المعلومات الأساسية" : "Basic information"}>
            <div className="space-y-3">
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
              <FormField label={ar ? "طريقة الفحص" : "Method"}>
                <select name="ExaminationMethod" className={fieldClass}>
                  <option value="1">Ultrasound</option>
                  <option value="2">Manual</option>
                  <option value="3">Speculum</option>
                </select>
              </FormField>
              <FormField
                label={ar ? "الطبيب البيطري" : "Veterinarian"}
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
            tone="sage"
            title={ar ? "جدولة الفحص القادم" : "Schedule follow-up"}
            icon={<CalendarDays className="h-4 w-4" />}
          >
            <div className="space-y-3">
              <input name="FollowUpDate" type="date" className={fieldClass} />
              <input
                name="FollowUpNotes"
                placeholder={ar ? "ملاحظات الموعد القادم" : "Follow-up notes"}
                className={fieldClass}
              />
            </div>
          </FormSection>
        </div>
      </div>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      <BilledServiceFields locale={locale} />
      <FormActions
        locale={locale}
        saving={saving}
        title={ar ? "فحص تبويض جديد" : "New ovulation exam"}
      />
    </form>
  );
}
