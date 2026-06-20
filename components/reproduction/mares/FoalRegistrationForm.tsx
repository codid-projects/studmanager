"use client";

import { FormEvent, useState } from "react";
import { Baby, Camera, CirclePlus } from "lucide-react";
import type { LocaleCode, HorseListItemDto } from "@/lib/api/types";
import {
  createFoal,
  getOrCreateMareProfile,
  type BreedingProfile,
} from "@/lib/api/mare-breeding-client";
import {
  fieldClass,
  FormActions,
  FormField,
  FormSection,
} from "../shared/FormPrimitives";
import { HorsePickerField } from "../shared/HorsePickerField";

export function FoalRegistrationForm({
  locale,
  profile,
  onSaved,
}: {
  locale: LocaleCode;
  profile: BreedingProfile;
  onSaved: () => void;
}) {
  const ar = locale === "ar";
  const [stallion, setStallion] = useState<HorseListItemDto | null>(null);
  const [surrogate, setSurrogate] = useState<HorseListItemDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stallion) {
      setError(ar ? "اختر الفحل الأب" : "Select the sire");
      return;
    }
    setSaving(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const foalName = String(data.get("FoalName") || "").trim();
      const foalNameAr = String(data.get("FoalNameAr") || "").trim();
      if (!foalName || !foalNameAr) {
        setError(
          ar
            ? "اسم المهر بالإنجليزية والعربية مطلوب."
            : "English and Arabic foal names are required.",
        );
        return;
      }
      data.set("FoalName", foalName);
      data.set("FoalNameAr", foalNameAr);
      const selectedHorse = Number(stallion.localId ?? stallion.id);
      const surrogateHorse = surrogate
        ? Number(surrogate.localId ?? surrogate.id)
        : 0;
      const stallionProfile = await getOrCreateMareProfile(
        locale,
        selectedHorse,
      );
      data.delete("StallionHorseId");
      data.delete("SurrogateMareHorseId");
      data.set("ProfileId", String(profile.profileId));
      data.set("StallionProfileId", String(stallionProfile.profileId));
      if (surrogateHorse) {
        const surrogateProfile = await getOrCreateMareProfile(
          locale,
          surrogateHorse,
        );
        data.set("SurrogateMareProfileId", String(surrogateProfile.profileId));
      }
      await createFoal(locale, profile.profileId, data);
      form.reset();
      setStallion(null);
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
      <div className="mb-5">
        <h2 className="text-[17px] font-semibold">
          {ar ? "تسجيل مولود جديد" : "Add new foal record"}
        </h2>
        <p className="text-[10px] text-[#8e827b]">Add New Foal Record</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
        <div className="space-y-3">
          <FormSection
            title={ar ? "النسب (Parentage)" : "Parentage"}
            icon={<Baby className="h-4 w-4" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label={ar ? "الفرس الأم (Donor Mare)" : "Donor mare"}>
                <div className={`${fieldClass} flex items-center`}>
                  {ar
                    ? profile.arabicName || profile.englishName
                    : profile.englishName || profile.arabicName}
                </div>
              </FormField>
              <FormField label={ar ? "الفحل الأب (Stallion)" : "Sire"} required>
                <HorsePickerField
                  locale={locale}
                  gender="Male"
                  name="StallionHorseId"
                  selected={stallion}
                  onSelect={setStallion}
                  required
                />
              </FormField>
              <FormField
                label={
                  ar ? "الفرس البديلة - اختياري" : "Surrogate mare - optional"
                }
                className="sm:col-span-2"
              >
                <HorsePickerField
                  locale={locale}
                  gender="Female"
                  name="SurrogateMareHorseId"
                  selected={surrogate}
                  onSelect={setSurrogate}
                  excludeHorseIds={[profile.horseId]}
                />
              </FormField>
            </div>
          </FormSection>
          <FormSection
            title={
              ar ? "تفاصيل الولادة والحالة الصحية" : "Birth and health details"
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label={ar ? "وزن الولادة (كجم)" : "Birth weight (kg)"}>
                <input
                  name="FoalWeightKg"
                  type="number"
                  step="0.1"
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "حالة الولادة" : "Birth status"}>
                <select name="Status" className={fieldClass}>
                  <option value="1">Normal / طبيعية</option>
                  <option value="2">Difficult / صعبة</option>
                  <option value="3">Premature / مبكرة</option>
                  <option value="4">Stillborn / ميتة</option>
                  <option value="5">Assisted / بمساعدة</option>
                  <option value="6">Cesarean / قيصرية</option>
                </select>
              </FormField>
              <FormField
                label={ar ? "ملاحظات صحية" : "Health notes"}
                className="sm:col-span-2"
              >
                <textarea
                  name="HealthNotes"
                  rows={4}
                  className={`${fieldClass} h-auto py-3`}
                />
              </FormField>
            </div>
          </FormSection>
        </div>
        <div className="space-y-3">
          <label className="grid h-40 cursor-pointer place-items-center rounded-[8px] border border-dashed border-[#cfc6be] bg-[#f5f2ec] text-center">
            <input
              name="FoalImage"
              type="file"
              accept="image/*"
              className="hidden"
            />
            <span>
              <Camera className="mx-auto h-7 w-7" />
              <small>{ar ? "اختر صورة المهر" : "Choose foal image"}</small>
            </span>
          </label>
          <FormSection
            title={ar ? "المعلومات الأساسية" : "Basic information"}
            icon={<CirclePlus className="h-4 w-4" />}
          >
            <div className="space-y-3">
              <FormField label={ar ? "اسم المهر" : "Foal name"} required>
                <input
                  required
                  maxLength={200}
                  name="FoalName"
                  className={fieldClass}
                />
              </FormField>
              <FormField
                label={ar ? "اسم المهر بالعربية" : "Arabic name"}
                required
              >
                <input
                  required
                  maxLength={200}
                  name="FoalNameAr"
                  className={fieldClass}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-2">
                <FormField label={ar ? "تاريخ الولادة" : "Birth date"} required>
                  <input
                    required
                    type="date"
                    name="BirthDate"
                    className={fieldClass}
                  />
                </FormField>
                <FormField label={ar ? "الجنس" : "Gender"}>
                  <select name="Gender" className={fieldClass}>
                    <option value="Male">Male / ذكر</option>
                    <option value="Female">Female / أنثى</option>
                  </select>
                </FormField>
              </div>
              <FormField label={ar ? "اللون" : "Color"}>
                <input name="Color" className={fieldClass} />
              </FormField>
            </div>
          </FormSection>
        </div>
      </div>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      <FormActions
        locale={locale}
        saving={saving}
        title={ar ? "تسجيل مولود جديد" : "New foal record"}
      />
    </form>
  );
}
