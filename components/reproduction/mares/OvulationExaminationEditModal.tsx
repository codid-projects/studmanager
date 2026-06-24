"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import type { LocaleCode } from "@/lib/api/types";
import {
  type MareExaminationDetail,
  updateExamination,
} from "@/lib/api/mare-breeding-client";
import { fieldClass, FormField } from "../shared/FormPrimitives";

export function OvulationExaminationEditModal({
  locale,
  record,
  onClose,
  onSaved,
}: {
  locale: LocaleCode;
  record: MareExaminationDetail | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const ar = locale === "ar";
  const [result, setResult] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setResult(record?.clinicalResult == null ? "" : String(record.clinicalResult));
    setStart(record?.expectedFoalingStartDate?.slice(0, 10) ?? "");
    setEnd(record?.expectedFoalingEndDate?.slice(0, 10) ?? "");
    setError("");
  }, [record]);

  if (!record) return null;
  const recordId = record.id;
  const pregnant = result === "3" || result === "4";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pregnant && (!start || !end)) {
      setError(ar ? "يرجى تحديد نطاق موعد الولاده المتوقع" : "Please select the expected foaling range");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = new FormData();
      data.set("ClinicalResult", result);
      if (pregnant) {
        data.set("ExpectedFoalingStartDate", start);
        data.set("ExpectedFoalingEndDate", end);
      }
      // Preserve existing attachments and billed services. The backend deletes
      // anything not listed in these keep-lists, so we echo back every id since
      // this dialog only edits the examination result, not its files/costs.
      for (const attachment of record!.attachments ?? [])
        data.append("AttachmentIdsToKeep", String(attachment.id));
      for (const service of record!.billedServices ?? [])
        data.append("BilledServiceIdsToKeep", String(service.id));
      await updateExamination(locale, "ovulation", recordId, data);
      await onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (ar ? "تعذر حفظ التعديلات" : "Unable to save changes"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[150] grid place-items-center bg-[#25160d]/55 p-4 backdrop-blur-sm" dir={ar ? "rtl" : "ltr"}>
      <form onSubmit={submit} className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-bold text-[#351d10]">{ar ? "تعديل حالة الفحص" : "Edit examination status"}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </header>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              [3, "Pregnant", "حامل"], [2, "Empty", "فارغة"], [6, "Aborted", "إجهاض"],
              [4, "Twins", "توأم"], [1, "Normal", "طبيعي"], [5, "Resorbing", "امتصاص"], [7, "Vulvoplasty", "تجميل"],
            ].map(([value, en, arabic]) => (
              <button key={value} type="button" onClick={() => setResult(String(value))}
                className={`min-h-12 rounded-lg p-2 text-[11px] font-bold ${result === String(value) ? "bg-[#351d10] text-white" : "bg-[#f5f2ec] text-[#594b42]"}`}>
                {ar ? arabic : en}
              </button>
            ))}
          </div>
          {pregnant ? (
            <div className="mt-4 rounded-xl border border-[#d7dfc3] bg-[#f7f9f1] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#53603d]">
                <CalendarDays className="h-4 w-4" />
                {ar ? "نطاق موعد الولاده المتوقع" : "Expected foaling range"}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label={ar ? "من" : "From"} required>
                  <input required type="date" value={start} onChange={(event) => setStart(event.target.value)} className={fieldClass} />
                </FormField>
                <FormField label={ar ? "إلى" : "To"} required>
                  <input required type="date" min={start || undefined} value={end} onChange={(event) => setEnd(event.target.value)} className={fieldClass} />
                </FormField>
              </div>
            </div>
          ) : null}
          {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
        </div>
        <footer className="flex justify-end gap-2 border-t px-5 py-4">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border px-5 py-2 text-xs font-bold">{ar ? "إلغاء" : "Cancel"}</button>
          <button disabled={saving || !result} className="rounded-lg bg-[#351d10] px-5 py-2 text-xs font-bold text-white disabled:opacity-50">{saving ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}</button>
        </footer>
      </form>
    </div>
  );
}
