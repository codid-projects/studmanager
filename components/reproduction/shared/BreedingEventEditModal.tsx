"use client";

import { FormEvent, useEffect, useState } from "react";
import { LoaderCircle, LockKeyhole, X } from "lucide-react";
import type { HorseListItemDto, LocaleCode } from "@/lib/api/types";
import {
  resolveBreedingPartner,
  updateBreedingEvent,
  type BreedingEventApi,
  type BreedingEventDetail,
} from "@/lib/api/breeding-event-client";
import {
  appendBilledServiceUpdate,
  BilledServiceFields,
} from "./BilledServiceFields";
import { fieldClass, FormField } from "./FormPrimitives";
import { HorsePickerField } from "./HorsePickerField";

function toLocalDatetime(input: string) {
  const date = new Date(input);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000)
    .toISOString()
    .slice(0, 16);
}

function toHorse(
  id: number | null | undefined,
  englishName: string | null | undefined,
  arabicName: string | null | undefined,
) {
  if (!id) return null;
  return {
    id,
    localId: id,
    englishName: englishName ?? null,
    arabicName: arabicName ?? null,
  } as HorseListItemDto;
}

export function BreedingEventEditModal({
  locale,
  api,
  viewingProfileId,
  record,
  onClose,
  onSaved,
}: {
  locale: LocaleCode;
  api: BreedingEventApi;
  viewingProfileId: number;
  record: BreedingEventDetail | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const ar = locale === "ar";
  const mareView = api === "mare";
  const partnerGender = mareView ? "Male" : "Female";
  const [partner, setPartner] = useState<HorseListItemDto | null>(null);
  const [surrogate, setSurrogate] = useState<HorseListItemDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const resolved = record
    ? resolveBreedingPartner(record, viewingProfileId)
    : null;
  const editablePartner = resolved?.eventOwnedByViewingProfile ?? false;

  useEffect(() => {
    if (!record) {
      setPartner(null);
      setSurrogate(null);
      return;
    }

    const visiblePartner = resolveBreedingPartner(record, viewingProfileId);
    setPartner(
      toHorse(visiblePartner.id, visiblePartner.name, visiblePartner.nameAr),
    );
    setSurrogate(
      toHorse(
        record.surrogateMareId,
        record.surrogateMareName,
        record.surrogateMareNameAr,
      ),
    );
    setError("");
  }, [record, viewingProfileId]);

  if (!record || !resolved) return null;
  const recordId = record.id;
  const billedServices = record.billedServices;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editablePartner && !partner) {
      setError(
        mareView
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
    try {
      const data = new FormData(event.currentTarget);
      if (editablePartner && partner) {
        data.set(
          "RelatedHorseId",
          String(partner.localId ?? partner.id),
        );
      } else {
        data.delete("RelatedHorseId");
      }

      if (surrogate)
        data.set("SurrogateMareId", String(surrogate.localId ?? surrogate.id));
      else data.delete("SurrogateMareId");

      const recordDate = String(data.get("RecordDate") ?? "").trim();
      if (recordDate)
        data.set("RecordDate", new Date(recordDate).toISOString());
      else data.delete("RecordDate");

      if (!String(data.get("VeterinarianName") ?? "").trim())
        data.delete("VeterinarianName");

      appendBilledServiceUpdate(
        data,
        "Natural breeding",
        billedServices,
      );
      await updateBreedingEvent(locale, api, recordId, data);
      await onSaved();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : ar
            ? "تعذر حفظ التعديلات"
            : "Unable to save changes",
      );
    } finally {
      setSaving(false);
    }
  }

  const partnerLabel = mareView
    ? ar
      ? "الفحل"
      : "Stallion"
    : ar
      ? "الفرس الأم"
      : "Donor mare";

  return (
    <div
      className="fixed inset-0 z-[150] grid place-items-center bg-[#25160d]/55 p-4 backdrop-blur-sm"
      dir={ar ? "rtl" : "ltr"}
    >
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-[#351d10]">
            {ar ? "تعديل سجل الطلوقة" : "Edit breeding service"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={ar ? "إغلاق" : "Close"}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
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
              defaultValue={toLocalDatetime(record.recordDate)}
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
            <input
              name="VeterinarianName"
              defaultValue={record.veterinarianName ?? ""}
              className={fieldClass}
            />
          </FormField>

          <div className="sm:col-span-2">
            <FormField label={partnerLabel} required>
              {editablePartner ? (
                <HorsePickerField
                  locale={locale}
                  gender={partnerGender}
                  name="RelatedHorseId"
                  selected={partner}
                  onSelect={setPartner}
                  required
                />
              ) : (
                <div className="rounded-[8px] border border-[#d9d1ca] bg-[#f7f3ef] px-3 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#46362d]">
                    <LockKeyhole className="h-4 w-4 text-[#7b675a]" />
                    {ar
                      ? resolved.nameAr || resolved.name || "—"
                      : resolved.name || resolved.nameAr || "—"}
                  </div>
                  <p className="mt-1 text-[10px] leading-5 text-[#897b72]">
                    {ar
                      ? "أُنشئ هذا السجل من ملف الطرف الآخر، لذلك يبقى الحصان المرتبط ثابتًا عند التعديل."
                      : "This event was created from the other horse's profile, so its linked horse stays fixed when editing."}
                  </p>
                </div>
              )}
            </FormField>
          </div>

          <FormField
            label={
              ar ? "الفرس البديلة (اختياري)" : "Surrogate mare (optional)"
            }
          >
            <HorsePickerField
              locale={locale}
              gender="Female"
              name="SurrogateMareId"
              selected={surrogate}
              onSelect={setSurrogate}
              excludeHorseIds={mareView
                ? [
                    Number(
                      editablePartner
                        ? record.profileHorseId
                        : record.relatedHorseId,
                    ),
                  ].filter((id) => id > 0)
                : partner
                  ? [Number(partner.localId ?? partner.id)]
                  : []}
            />
          </FormField>

          {api === "stallion" && editablePartner ? (
            <FormField label={ar ? "طريقة التلقيح" : "Insemination method"}>
              <select
                name="InseminationMethod"
                defaultValue={String(record.inseminationMethod ?? 1)}
                className={fieldClass}
              >
                <option value="1">{ar ? "طبيعية" : "Natural"}</option>
                <option value="2">{ar ? "طازج" : "Fresh"}</option>
                <option value="3">{ar ? "مجمّد" : "Frozen"}</option>
              </select>
            </FormField>
          ) : null}

          <FormField
            label={ar ? "موعد تكرار التلقيح" : "Repeat breeding date"}
            required
          >
            <input
              required
              name="FollowUpDate"
              type="date"
              defaultValue={record.followUpDate?.slice(0, 10) ?? ""}
              className={fieldClass}
            />
          </FormField>
          <FormField
            label={ar ? "ملاحظات الموعد القادم" : "Follow-up notes"}
          >
            <input
              name="FollowUpNotes"
              defaultValue={record.followUpNotes ?? ""}
              className={fieldClass}
            />
          </FormField>
          <FormField
            label={ar ? "ملاحظات إضافية" : "Additional notes"}
            className="sm:col-span-2"
          >
            <textarea
              name="VeterinarianComments"
              defaultValue={record.veterinarianComments ?? ""}
              rows={3}
              className={`${fieldClass} h-auto py-3`}
            />
          </FormField>

          <div className="sm:col-span-2">
            <BilledServiceFields
              locale={locale}
              initial={record.billedServices}
            />
          </div>
        </div>

        {error && <p className="mx-5 text-sm text-red-600">{error}</p>}
        <footer className="flex justify-end gap-2 p-5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border px-5"
          >
            {ar ? "إلغاء" : "Cancel"}
          </button>
          <button
            disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#351d10] px-6 text-white disabled:opacity-50"
          >
            {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {saving
              ? ar
                ? "جارٍ الحفظ..."
                : "Saving..."
              : ar
                ? "حفظ التعديلات"
                : "Save changes"}
          </button>
        </footer>
      </form>
    </div>
  );
}
