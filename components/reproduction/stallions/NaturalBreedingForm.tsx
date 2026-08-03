"use client";

import { FormEvent, useState } from "react";
import { CalendarDays, Dna } from "lucide-react";
import type { HorseListItemDto, LocaleCode } from "@/lib/api/types";
import { type BreedingProfile } from "@/lib/api/mare-breeding-client";
import {
  createBreedingEvent,
  type BreedingEventApi,
} from "@/lib/api/breeding-event-client";
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
  api = "stallion",
  onSaved,
}: {
  locale: LocaleCode;
  profile: BreedingProfile;
  api?: BreedingEventApi;
  onSaved: () => void;
}) {
  const ar = locale === "ar";
  const mareProfile = api === "mare";
  const partnerGender = mareProfile ? "Male" : "Female";
  const [partner, setPartner] = useState<HorseListItemDto | null>(null);
  const [surrogate, setSurrogate] = useState<HorseListItemDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!partner) {
      setError(
        mareProfile
          ? ar
            ? "اختر الفحل"
            : "Select the stallion"
          : ar
            ? "اختر الفرس الأم"
            : "Select the donor mare",
      );
      return;
    }
    setSaving(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      data.set(
        "RelatedHorseId",
        String(partner.localId ?? partner.id),
      );
      if (surrogate)
        data.set("SurrogateMareId", String(surrogate.localId ?? surrogate.id));
      else data.delete("SurrogateMareId");
      data.set("ProfileId", String(profile.profileId));
      appendBilledService(data, "Natural breeding");
      const recordDate = String(data.get("RecordDate") ?? "").trim();
      // The service time is optional for the user. When it is unknown, store
      // the time of registration so the event still has a valid audit date.
      data.set(
        "RecordDate",
        recordDate
          ? new Date(recordDate).toISOString()
          : new Date().toISOString(),
      );
      if (!String(data.get("VeterinarianName") ?? "").trim())
        data.delete("VeterinarianName");
      await createBreedingEvent(locale, api, data);
      form.reset();
      setPartner(null);
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
            title={
              mareProfile
                ? ar
                  ? "بيانات الفحل"
                  : "Stallion details"
                : ar
                  ? "بيانات الفرس"
                  : "Mare details"
            }
            icon={<Dna className="h-4 w-4" />}
            tone="sage"
          >
            <div className="space-y-3">
              <FormField
                label={
                  mareProfile
                    ? ar
                      ? "الفحل"
                      : "Stallion"
                    : ar
                      ? "الفرس الأم"
                      : "Donor mare"
                }
                required
              >
                <HorsePickerField
                  locale={locale}
                  gender={partnerGender}
                  name="RelatedHorseId"
                  selected={partner}
                  onSelect={(horse) => {
                    setPartner(horse);
                    if (
                      !mareProfile &&
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
                  excludeHorseIds={[
                    ...(mareProfile ? [profile.horseId] : []),
                    ...(!mareProfile && partner
                      ? [Number(partner.localId ?? partner.id)]
                      : []),
                  ]}
                />
              </FormField>
            </div>
          </FormSection>
          {!mareProfile && (
            <FormSection
              title={ar ? "طريقة التلقيح" : "Insemination method"}
            >
              <div className="grid grid-cols-3 gap-2">
                {[
                  [1, ar ? "طبيعية" : "Natural"],
                  [2, ar ? "طازج" : "Fresh"],
                  [3, ar ? "مجمّد" : "Frozen"],
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
          )}
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
                label={
                  ar
                    ? "تاريخ ووقت الطلوقة (اختياري)"
                    : "Service date and time (optional)"
                }
              >
                <input
                  name="RecordDate"
                  type="datetime-local"
                  className={fieldClass}
                />
              </FormField>
              <FormField
                label={
                  ar
                    ? "الطبيب المسؤول (اختياري)"
                    : "Veterinarian (optional)"
                }
              >
                <input name="VeterinarianName" className={fieldClass} />
              </FormField>
            </div>
          </FormSection>
          <FormSection tone="sage" title={ar ? "تكرار التلقيح" : "Follow-up"}>
            <div className="space-y-3">
              <FormField
                label={ar ? "موعد تكرار التلقيح" : "Repeat breeding date"}
                required
              >
                <input
                  required
                  name="FollowUpDate"
                  type="date"
                  className={fieldClass}
                />
              </FormField>
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
