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
  const [clinicalResult, setClinicalResult] = useState("");
  const [expectedStartDate, setExpectedStartDate] = useState("");
  const [expectedEndDate, setExpectedEndDate] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setError("");
    const data = new FormData(form);
    try {
      const pregnant = clinicalResult === "3" || clinicalResult === "4";
      if (pregnant && (!expectedStartDate || !expectedEndDate)) {
        throw new Error(ar ? "يرجى تحديد نطاق موعد الولاده المتوقع" : "Please select the expected foaling range");
      }
      if (pregnant && expectedEndDate < expectedStartDate) {
        throw new Error(ar ? "يجب أن تكون نهاية النطاق بعد بدايته" : "The range end must be after its start");
      }

      data.set("ProfileId", String(profile.profileId));
      if (pregnant) {
        data.set("ExpectedFoalingStartDate", expectedStartDate);
        data.set("ExpectedFoalingEndDate", expectedEndDate);
      }
      appendBilledService(data, "Ovulation examination");
      data.set(
        "RecordDate",
        new Date(String(data.get("RecordDate"))).toISOString(),
      );
      await createExamination(locale, "ovulation", data);
      form.reset();
      setClinicalResult("");
      setExpectedStartDate("");
      setExpectedEndDate("");
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed");
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={submit} className="rounded-[10px] bg-white p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px]">
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
                  <option value="0">{ar ? "لا يوجد" : "None"}</option>
                  <option value="1">{ar ? "خفيف" : "Mild"}</option>
                  <option value="2">{ar ? "متوسط" : "Moderate"}</option>
                  <option value="3">{ar ? "شديد" : "Severe"}</option>
                </select>
              </FormField>
              <FormField label={ar ? "عنق الرحم" : "Cervix"}>
                <select name="CervicalStatus" className={fieldClass}>
                  <option value="1">{ar ? "مغلق" : "Closed"}</option>
                  <option value="2">
                    {ar ? "مفتوح جزئياً" : "Partially open"}
                  </option>
                  <option value="3">{ar ? "مفتوح" : "Open"}</option>
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
                    checked={clinicalResult === String(value)}
                    onChange={(event) => {
                      setClinicalResult(event.target.value);
                      if (event.target.value !== "3" && event.target.value !== "4") {
                        setExpectedStartDate("");
                        setExpectedEndDate("");
                      }
                    }}
                    className="peer sr-only"
                  />
                  <span className="grid min-h-14 place-items-center rounded-[7px] bg-[#f5f2ec] p-2 text-center text-[10px] peer-checked:bg-[#351d10] peer-checked:text-white">
                    {label}
                  </span>
                </label>
              ))}
            </div>
            {clinicalResult === "3" || clinicalResult === "4" ? (
              <div className="mt-4 rounded-xl border border-[#d7dfc3] bg-[#f7f9f1] p-3">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#53603d]">
                  <CalendarDays className="h-4 w-4" />
                  {ar ? "نطاق موعد الولاده المتوقع" : "Expected foaling range"}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label={ar ? "من" : "From"} required>
                    <input
                      required
                      type="date"
                      value={expectedStartDate}
                      onChange={(event) => {
                        setExpectedStartDate(event.target.value);
                        if (expectedEndDate && expectedEndDate < event.target.value) setExpectedEndDate(event.target.value);
                      }}
                      className={fieldClass}
                    />
                  </FormField>
                  <FormField label={ar ? "إلى" : "To"} required>
                    <input
                      required
                      type="date"
                      min={expectedStartDate || undefined}
                      value={expectedEndDate}
                      onChange={(event) => setExpectedEndDate(event.target.value)}
                      className={fieldClass}
                    />
                  </FormField>
                </div>
                <p className="mt-2 text-[10px] leading-5 text-[#74805f]">
                  {ar
                    ? "سيظهر هذا النطاق كموعد ولادة متوقع في التقويم بعد حفظ الفحص."
                    : "This range will appear as an expected foaling window in the calendar after saving."}
                </p>
              </div>
            ) : null}
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
                  <option value="1">{ar ? "الموجات فوق الصوتية" : "Ultrasound"}</option>
                  <option value="2">{ar ? "فحص يدوي" : "Manual"}</option>
                  <option value="3">{ar ? "المنظار المهبلي" : "Speculum"}</option>
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
