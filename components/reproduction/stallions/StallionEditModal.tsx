"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import type { HorseListItemDto, LocaleCode } from "@/lib/api/types";
import { fieldClass } from "../shared/FormPrimitives";
import { HorsePickerField } from "../shared/HorsePickerField";
import {
  updateStallionRecord,
  type StallionRecordDetail,
  type StallionSection,
} from "@/lib/api/stallion-breeding-client";
import { appendBilledService } from "../shared/BilledServiceFields";

const value = (record: StallionRecordDetail, key: string) =>
  record[key] == null ? "" : String(record[key]);
const datetime = (input: string) => {
  const date = new Date(input);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};
export function StallionEditModal({
  locale,
  section,
  record,
  onClose,
  onSaved,
}: {
  locale: LocaleCode;
  section: StallionSection;
  record: StallionRecordDetail | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const ar = locale === "ar";
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mare, setMare] = useState<HorseListItemDto | null>(null);
  const [surrogate, setSurrogate] = useState<HorseListItemDto | null>(null);
  useEffect(() => {
    setError("");
    const horse = (
      id?: number | null,
      en?: string | null,
      horseAr?: string | null,
    ) =>
      id
        ? ({
            id,
            localId: id,
            englishName: en ?? null,
            arabicName: horseAr ?? null,
          } as HorseListItemDto)
        : null;
    setMare(
      horse(
        record?.mareId,
        record?.mareName == null ? null : String(record.mareName),
        record?.mareNameAr == null ? null : String(record.mareNameAr),
      ),
    );
    setSurrogate(
      horse(
        record?.surrogateMareId,
        record?.surrogateMareName == null
          ? null
          : String(record.surrogateMareName),
        record?.surrogateMareNameAr == null
          ? null
          : String(record.surrogateMareNameAr),
      ),
    );
  }, [record]);
  if (!record) return null;
  const field = (
    name: string,
    labelAr: string,
    labelEn: string,
    type = "text",
    required = false,
  ) => (
    <label className="text-[11px] text-[#564941]">
      {ar ? labelAr : labelEn}
      <input
        name={name}
        type={type}
        step={type === "number" ? "any" : undefined}
        required={required}
        defaultValue={
          name === "RecordDate"
            ? datetime(record.recordDate)
            : value(record, name.charAt(0).toLowerCase() + name.slice(1))
        }
        className={fieldClass}
      />
    </label>
  );
  const select = (
    name: string,
    labelAr: string,
    labelEn: string,
    options: Array<[number, string, string]>,
  ) => (
    <label className="text-[11px] text-[#564941]">
      {ar ? labelAr : labelEn}
      <select
        name={name}
        defaultValue={value(
          record,
          name.charAt(0).toLowerCase() + name.slice(1),
        )}
        className={fieldClass}
      >
        {options.map(([id, en, arabic]) => (
          <option key={id} value={id}>
            {ar ? arabic : en}
          </option>
        ))}
      </select>
    </label>
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setError("");
    try {
      const data = new FormData(form);
      data.set(
        "RecordDate",
        new Date(String(data.get("RecordDate"))).toISOString(),
      );
      appendBilledService(data, section);
      await updateStallionRecord(locale, section, record!.id, data);
      await onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-[#25160d]/55 p-4 backdrop-blur-sm"
      dir={ar ? "rtl" : "ltr"}
    >
      <form
        ref={formRef}
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">
          <h2 className="text-lg font-bold">
            {ar ? "تعديل السجل" : "Edit record"}
          </h2>
          <button type="button" onClick={onClose}>
            <X />
          </button>
        </header>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {field(
            "RecordDate",
            "التاريخ والوقت",
            "Date and time",
            "datetime-local",
            true,
          )}
          {field(
            "VeterinarianName",
            "الطبيب / المسؤول",
            "Veterinarian",
            "text",
            true,
          )}
          <label className="text-[11px] text-[#564941]">
            {ar ? "اسم الخدمة" : "Service name"}
            <input
              name="ServiceName"
              defaultValue={record.billedServices?.[0]?.serviceName ?? ""}
              className={fieldClass}
            />
          </label>
          <label className="text-[11px] text-[#564941]">
            {ar ? "القيمة بالجنيه المصري" : "Amount (EGP)"}
            <div className="relative">
              <input
                name="ServicePrice"
                type="number"
                min="0"
                step="any"
                defaultValue={record.billedServices?.[0]?.totalPrice ?? ""}
                className={`${fieldClass} pe-14`}
              />
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-bold">
                EGP
              </span>
            </div>
          </label>
          {section === "breeding-events" && (
            <>
              <label className="text-[11px] text-[#564941]">
                {ar ? "الفرس الأم" : "Donor mare"}
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
              </label>
              <label className="text-[11px] text-[#564941]">
                {ar ? "الفرس البديلة" : "Surrogate mare"}
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
              </label>
              {select(
                "InseminationMethod",
                "طريقة التلقيح",
                "Insemination method",
                [
                  [1, "Natural", "طبيعية"],
                  [2, "Fresh", "طازج"],
                  [3, "Frozen", "مجمد"],
                ],
              )}
            </>
          )}
          {section === "semen-collections" && (
            <>
              {field("VolumeMl", "الحجم", "Volume", "number", true)}
              {field(
                "ConcentrationMillionPerMl",
                "التركيز",
                "Concentration",
                "number",
                true,
              )}
              {field(
                "MotilityPercent",
                "الحركة الكلية",
                "Motility",
                "number",
                true,
              )}
              {field(
                "ProgressiveMotilityPercent",
                "الحركة التقدمية",
                "Progressive motility",
                "number",
                true,
              )}
              {field("VigorScore", "القوة", "Vigor", "number", true)}
              {field(
                "MorphologyPercent",
                "الشكل الطبيعي",
                "Morphology",
                "number",
                true,
              )}
              {field(
                "ResultingDoses",
                "الجرعات الناتجة",
                "Resulting doses",
                "number",
                true,
              )}
              {select("CollectionMethod", "طريقة الجمع", "Collection method", [
                [1, "Artificial vagina", "المهبل الصناعي"],
                [2, "Manual", "يدوي"],
                [3, "Other", "أخرى"],
              ])}
              {select("StorageType", "نوع التخزين", "Storage type", [
                [1, "Fresh", "طازج"],
                [2, "Cooled", "مبرد"],
                [3, "Frozen", "مجمد"],
              ])}
              {select("Appearance", "المظهر", "Appearance", [
                [1, "Milky white", "أبيض حليبي"],
                [2, "Yellowish", "مصفر"],
                [3, "Watery", "مائي"],
              ])}
              {field("TemperatureC", "درجة الحرارة", "Temperature", "number")}
              {field("HumidityPercent", "الرطوبة", "Humidity", "number")}
            </>
          )}
          {section === "semen-shipments" && (
            <>
              {field("Destination", "المحطة", "Destination")}
              {field("City", "المدينة", "City")}
              {field("RecipientName", "اسم المستلم", "Recipient")}
              {field("CustomerName", "اسم العميل", "Customer")}
              {field("Latitude", "خط العرض", "Latitude")}
              {field("Longitude", "خط الطول", "Longitude")}
              {field(
                "Concentration",
                "التركيز",
                "Concentration",
                "number",
                true,
              )}
              {field(
                "ProgressiveMotility",
                "الحركة التقدمية",
                "Progressive motility",
                "number",
                true,
              )}
              {select("StorageType", "نوع التخزين", "Storage type", [
                [1, "Fresh", "طازج"],
                [2, "Cooled", "مبرد"],
                [3, "Frozen", "مجمد"],
              ])}
              {select("Status", "حالة الشحنة", "Status", [
                [1, "Preparing", "قيد التجهيز"],
                [2, "Scheduled", "مجدولة"],
                [3, "Urgent", "عاجلة"],
              ])}
            </>
          )}
          {section === "soundness-examinations" && (
            <>
              {field(
                "RightTesticleDescription",
                "الخصية اليمنى",
                "Right testicle",
              )}
              {field(
                "LeftTesticleDescription",
                "الخصية اليسرى",
                "Left testicle",
              )}
              {select("LibidoLevel", "الرغبة الجنسية", "Libido", [
                [1, "Low", "منخفض"],
                [2, "Normal", "طبيعي"],
                [3, "High", "مرتفع"],
              ])}
              {select("Recommendation", "التوصية", "Recommendation", [
                [1, "Needs treatment", "يحتاج علاج"],
                [2, "Needs rest", "يحتاج راحة"],
                [3, "Fit for breeding", "لائق للتربية"],
                [4, "Low quality", "جودة منخفضة"],
              ])}
              {field("VolumeMl", "الحجم", "Volume", "number", true)}
              {field(
                "ConcentrationMillionPerMl",
                "التركيز",
                "Concentration",
                "number",
                true,
              )}
              {field("MotilityPercent", "الحركة", "Motility", "number", true)}
              {field(
                "ProgressiveMotilityPercent",
                "الحركة التقدمية",
                "Progressive motility",
                "number",
                true,
              )}
              {field("VigorScore", "القوة", "Vigor", "number", true)}
              {select("StorageType", "نوع التخزين", "Storage type", [
                [1, "Fresh", "طازج"],
                [2, "Cooled", "مبرد"],
                [3, "Frozen", "مجمد"],
              ])}
            </>
          )}
          <label className="sm:col-span-2 text-[11px]">
            {ar ? "ملاحظات" : "Notes"}
            <textarea
              name="VeterinarianComments"
              defaultValue={record.veterinarianComments ?? ""}
              className={`${fieldClass} h-24 py-3`}
            />
          </label>
          {field("FollowUpDate", "الموعد القادم", "Follow-up date", "date")}
          {field("FollowUpNotes", "ملاحظات الموعد", "Follow-up notes")}
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
