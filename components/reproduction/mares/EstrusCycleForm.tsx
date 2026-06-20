"use client";

import { FormEvent, useState } from "react";
import { CalendarPlus, TrendingUp } from "lucide-react";
import type { LocaleCode } from "@/lib/api/types";
import {
  createCycle,
  type BreedingProfile,
  type EstrusCycle,
} from "@/lib/api/mare-breeding-client";
import {
  fieldClass,
  FormActions,
  FormField,
  FormSection,
} from "../shared/FormPrimitives";

export function EstrusCycleForm({
  locale,
  profile,
  cycles,
  onSaved,
}: {
  locale: LocaleCode;
  profile: BreedingProfile;
  cycles: EstrusCycle[];
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
      await createCycle(locale, profile.profileId, {
        startDate: String(data.get("startDate")),
        endDate: String(data.get("endDate") || "") || null,
        intensityGrade: Number(data.get("intensityGrade")),
        notes: String(data.get("notes") || ""),
      });
      form.reset();
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed");
    } finally {
      setSaving(false);
    }
  }
  const recent = cycles.slice(0, 3);
  return (
    <form onSubmit={submit} className="rounded-[10px] bg-white p-4">
      <div className="grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
        <FormSection
          title={ar ? "لوحة تتبع الدورة" : "Cycle tracking"}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="sage"
        >
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              [
                ar ? "مدة الدورة" : "Duration",
                cycles[0]?.durationDays
                  ? `${cycles[0].durationDays} ${ar ? "أيام" : "days"}`
                  : "—",
              ],
              [ar ? "التكرار" : "Recurrence", `${cycles.length}`],
              [ar ? "الموعد المتوقع" : "Next expected", "—"],
            ].map(([label, value], index) => (
              <div
                key={label}
                className={`rounded-[7px] p-3 text-center ${index === 2 ? "bg-[#351d10] text-white" : "bg-white"}`}
              >
                <p className="text-[9px] opacity-70">{label}</p>
                <strong className="mt-1 block text-[13px]">{value}</strong>
              </div>
            ))}
          </div>
          <div className="my-6 flex items-center justify-between px-4">
            <span className="h-3 w-14 rounded-full bg-[#d8e1d9]" />
            <span className="h-3 w-14 rounded-full bg-[#8db296]" />
            <span className="h-3 w-14 rounded-full bg-[#296b43]" />
          </div>
          <h4 className="mb-2 text-[11px] font-semibold">
            {ar ? "السجل الأخير" : "Recent history"}
          </h4>
          <div className="space-y-2">
            {recent.map((cycle) => (
              <div
                key={cycle.id}
                className="flex items-center justify-between border-e-4 border-[#2f8450] bg-white px-3 py-2 text-[10px]"
              >
                <span>
                  {new Date(cycle.startDate).toLocaleDateString(
                    ar ? "ar-EG" : "en-GB",
                  )}{" "}
                  -{" "}
                  {cycle.endDate
                    ? new Date(cycle.endDate).toLocaleDateString(
                        ar ? "ar-EG" : "en-GB",
                      )
                    : "—"}
                </span>
                <b>Grade {cycle.intensityGrade ?? "—"}</b>
              </div>
            ))}
          </div>
        </FormSection>
        <FormSection
          title={ar ? "تسجيل دورة جديدة" : "Add new cycle"}
          icon={<CalendarPlus className="h-4 w-4" />}
          tone="sage"
        >
          <div className="space-y-3">
            <FormField label={ar ? "اختر الفرس" : "Selected mare"}>
              <div className={`${fieldClass} flex items-center`}>
                {ar
                  ? profile.arabicName || profile.englishName
                  : profile.englishName || profile.arabicName}
              </div>
            </FormField>
            <div className="grid grid-cols-2 gap-2">
              <FormField label={ar ? "بداية الدورة" : "Start date"} required>
                <input
                  required
                  name="startDate"
                  type="date"
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "نهاية الدورة" : "End date"}>
                <input name="endDate" type="date" className={fieldClass} />
              </FormField>
            </div>
            <FormField label={ar ? "درجة الشدة (1-4)" : "Intensity (1-4)"}>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((value) => (
                  <label key={value}>
                    <input
                      required
                      type="radio"
                      name="intensityGrade"
                      value={value}
                      className="peer sr-only"
                    />
                    <span className="grid h-9 cursor-pointer place-items-center rounded-full border border-[#b7cabc] text-xs peer-checked:bg-[#53a56d] peer-checked:text-white">
                      {value}
                    </span>
                  </label>
                ))}
              </div>
            </FormField>
            <FormField label={ar ? "ملاحظات" : "Notes"}>
              <textarea
                name="notes"
                rows={4}
                className={`${fieldClass} h-auto py-3`}
              />
            </FormField>
          </div>
        </FormSection>
      </div>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      <FormActions
        locale={locale}
        saving={saving}
        title={ar ? "متابعة دورة الشبق" : "Estrus Cycle Log"}
      />
    </form>
  );
}
