"use client";

import { FormEvent, useState } from "react";
import { ClipboardPlus, Upload } from "lucide-react";
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
import { appendBilledService } from "../shared/BilledServiceFields";

export function MareSoundnessForm({
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
      appendBilledService(data, "Mare breeding soundness");
      data.set(
        "RecordDate",
        new Date(String(data.get("RecordDate"))).toISOString(),
      );
      for (const name of [
        "IsFollicleScan",
        "IsPregnancyCheck",
        "IsHormoneWithdrawal",
      ])
        if (!data.has(name)) data.set(name, "false");
      await createExamination(locale, "soundness", data);
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
      <div className="grid gap-3 lg:grid-cols-[170px_1fr]">
        <aside className="space-y-3">
          <FormSection
            title={ar ? "إجراءات إضافية" : "Additional actions"}
            tone="sage"
          >
            <div className="space-y-2">
              {[
                ["IsPregnancyCheck", ar ? "فحص حمل" : "Pregnancy check"],
                [
                  "IsHormoneWithdrawal",
                  ar ? "سحب هرمونات" : "Hormone withdrawal",
                ],
                ["IsFollicleScan", ar ? "فحص حويصلات" : "Follicle scan"],
              ].map(([name, label]) => (
                <label
                  key={name}
                  className="flex items-center justify-between text-[10px]"
                >
                  {label}
                  <input type="checkbox" name={name} value="true" />
                </label>
              ))}
            </div>
          </FormSection>
          <FormSection title={ar ? "تفاصيل التكاليف" : "Cost details"}>
            <FormField label={ar ? "اسم الخدمة" : "Service name"}>
              <input name="ServiceName" className={fieldClass} />
            </FormField>
            <FormField label={ar ? "السعر" : "Price"}>
              <input name="ServicePrice" type="number" className={fieldClass} />
            </FormField>
          </FormSection>
          <label className="grid h-28 cursor-pointer place-items-center rounded-[8px] border border-dashed border-[#cfc5bd] bg-[#faf8f3] text-center text-[10px] text-[#647e6a]">
            <input type="file" name="Attachments" className="hidden" />
            <span>
              <Upload className="mx-auto mb-2 h-5 w-5" />
              {ar ? "أرفق صورة أو تقرير" : "Attach image or report"}
            </span>
          </label>
        </aside>
        <div className="space-y-3">
          <FormSection
            title={ar ? "المعلومات الأساسية" : "Basic information"}
            icon={<ClipboardPlus className="h-4 w-4" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label={ar ? "اسم الطبيب" : "Veterinarian"} required>
                <input
                  required
                  name="VeterinarianName"
                  className={fieldClass}
                />
              </FormField>
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
              <FormField label={ar ? "نوع الفحص" : "Repetition"}>
                <select name="Repetition" className={fieldClass}>
                  <option value="1">Routine / دوري</option>
                  <option value="2">Emergency / طارئ</option>
                </select>
              </FormField>
            </div>
          </FormSection>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormSection title={ar ? "المبايض" : "Ovaries"}>
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="RightOvarySizeMm"
                  type="number"
                  placeholder={ar ? "المبيض الأيمن" : "Right ovary"}
                  className={fieldClass}
                />
                <input
                  name="LeftOvarySizeMm"
                  type="number"
                  placeholder={ar ? "المبيض الأيسر" : "Left ovary"}
                  className={fieldClass}
                />
              </div>
            </FormSection>
            <FormSection title={ar ? "الرحم" : "Uterus"}>
              <input
                name="UterineNotes"
                placeholder={ar ? "سجل ملاحظات طبية" : "Medical notes"}
                className={fieldClass}
              />
            </FormSection>
          </div>
          <FormSection
            title={ar ? "نتائج الفحص السريري" : "Clinical examination results"}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <select name="CervicalStatus" className={fieldClass}>
                <option value="1">Closed</option>
                <option value="2">Partially open</option>
                <option value="3">Open</option>
              </select>
              <input
                name="VaginalStatus"
                placeholder={ar ? "المهبل" : "Vaginal status"}
                className={fieldClass}
              />
              <select name="EdemaGrade" className={fieldClass}>
                <option value="0">Edema 0</option>
                <option value="1">Edema 1</option>
                <option value="2">Edema 2</option>
                <option value="3">Edema 3</option>
              </select>
            </div>
          </FormSection>
          <FormSection
            title={
              ar ? "ملاحظات الطبيب التفصيلية" : "Detailed veterinarian notes"
            }
          >
            <textarea
              name="VeterinarianComments"
              rows={4}
              className={`${fieldClass} h-auto py-3`}
            />
          </FormSection>
        </div>
      </div>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      <FormActions
        locale={locale}
        saving={saving}
        title={ar ? "فحص تناسلي للفرس" : "Mare soundness exam"}
      />
    </form>
  );
}
