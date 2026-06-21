"use client";

import { FormEvent, useState } from "react";
import { CalendarDays, Dna } from "lucide-react";
import type { HorseListItemDto, LocaleCode } from "@/lib/api/types";
import { type BreedingProfile } from "@/lib/api/mare-breeding-client";
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
import { HorsePickerField } from "../shared/HorsePickerField";

export function NaturalBreedingForm({
  locale,
  profile,
  onSaved,
}: {
  locale: LocaleCode;
  profile: BreedingProfile;
  onSaved: () => void;
}) {
  const ar = locale === "ar";
  const [mare, setMare] = useState<HorseListItemDto | null>(null);
  const [surrogate, setSurrogate] = useState<HorseListItemDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mare) {
      setError(ar ? "اختر الفرس الأم" : "Select the donor mare");
      return;
    }
    setSaving(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      data.set("MareId", String(mare.localId ?? mare.id));
      if (surrogate)
        data.set("SurrogateMareId", String(surrogate.localId ?? surrogate.id));
      else data.delete("SurrogateMareId");
      data.set("ProfileId", String(profile.profileId));
      appendBilledService(data, "Natural breeding");
      data.set(
        "RecordDate",
        new Date(String(data.get("RecordDate"))).toISOString(),
      );
      await createStallionRecord(locale, "breeding-events", data);
      form.reset();
      setMare(null);
      setSurrogate(null);
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
        {ar ? "تسجيل طلوقة جديدة" : "New breeding service"}
      </h2>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <FormSection
            title={ar ? "بيانات الفرسة" : "Mare details"}
            icon={<Dna className="h-4 w-4" />}
            tone="sage"
          >
            <div className="space-y-3">
              <FormField label={ar ? "الفرس الأم" : "Donor mare"} required>
                <HorsePickerField
                  locale={locale}
                  gender="Female"
                  name="MareId"
                  selected={mare}
                  onSelect={(horse) => {
                    setMare(horse);
                    if (
                      horse &&
                      surrogate &&
                      Number(horse.localId ?? horse.id) ===
                        Number(surrogate.localId ?? surrogate.id)
                    )
                      setSurrogate(null);
                  }}
                  required
                />
              </FormField>
              <FormField
                label={
                  ar ? "الفرس البديلة - اختياري" : "Surrogate mare - optional"
                }
              >
                <HorsePickerField
                  locale={locale}
                  gender="Female"
                  name="SurrogateMareId"
                  selected={surrogate}
                  onSelect={setSurrogate}
                  excludeHorseIds={
                    mare ? [Number(mare.localId ?? mare.id)] : []
                  }
                />
              </FormField>
            </div>
          </FormSection>
          <FormSection title={ar ? "طريقة التلقيح" : "Insemination method"}>
            <div className="grid grid-cols-3 gap-2">
              {[
                [1, "Natural / طبيعية"],
                [2, "Fresh / مجمعة"],
                [3, "Frozen / مجمدة"],
              ].map(([value, label]) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="InseminationMethod"
                    value={value}
                    defaultChecked={value === 1}
                    className="peer sr-only"
                  />
                  <span className="grid h-9 cursor-pointer place-items-center rounded-[7px] bg-[#d6eef6] text-[10px] peer-checked:bg-[#351d10] peer-checked:text-white">
                    {label}
                  </span>
                </label>
              ))}
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
          <FormSection
            title={ar ? "المعلومات الأساسية" : "Basic information"}
            icon={<CalendarDays className="h-4 w-4" />}
          >
            <div className="space-y-3">
              <FormField
                label={ar ? "تاريخ ووقت الخدمة" : "Service date and time"}
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
          <FormSection tone="sage" title={ar ? "تكرار التلقيح" : "Follow-up"}>
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
        title={ar ? "تسجيل طلوقة جديدة" : "New breeding service"}
      />
    </form>
  );
}
