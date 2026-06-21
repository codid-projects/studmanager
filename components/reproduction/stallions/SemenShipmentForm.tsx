"use client";

import { FormEvent, useState } from "react";
import { Building2, FlaskConical, MapPin, PencilLine, Truck } from "lucide-react";
import type { ExternalStudSearchItem, LocaleCode } from "@/lib/api/types";
import type { BreedingProfile } from "@/lib/api/mare-breeding-client";
import { createStallionRecord } from "@/lib/api/stallion-breeding-client";
import { ExternalStudPicker } from "@/components/horses/ExternalStudPicker";
import { useTranslation } from "@/lib/locale-context";
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

export function SemenShipmentForm({
  locale,
  profile,
  onSaved,
}: {
  locale: LocaleCode;
  profile: BreedingProfile;
  onSaved: () => void;
}) {
  const ar = locale === "ar";
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [destinationMode, setDestinationMode] = useState<"stud" | "manual">("stud");
  const [selectedStud, setSelectedStud] = useState<ExternalStudSearchItem | null>(null);
  const selectedStudName = selectedStud
    ? ar
      ? selectedStud.studArabicName || selectedStud.studName || ""
      : selectedStud.studName || selectedStud.studArabicName || ""
    : "";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setError("");
    const data = new FormData(form);
    try {
      if (destinationMode === "stud" && !selectedStud) {
        throw new Error(t("shipment.studRequired"));
      }

      data.set("ProfileId", String(profile.profileId));
      if (destinationMode === "stud" && selectedStud) {
        data.set("DestinedStudId", String(selectedStud.id));
        data.set("Destination", selectedStudName);
        data.set("City", selectedStud.city || selectedStud.country || "");
        data.set("Longitude", selectedStud.xCor == null ? "" : String(selectedStud.xCor));
        data.set("Latitude", selectedStud.yCor == null ? "" : String(selectedStud.yCor));
      } else {
        data.delete("DestinedStudId");
        data.delete("Longitude");
        data.delete("Latitude");
      }
      appendBilledService(data, "Semen shipment");
      data.set(
        "RecordDate",
        new Date(String(data.get("RecordDate"))).toISOString(),
      );
      await createStallionRecord(locale, "semen-shipments", data);
      form.reset();
      setSelectedStud(null);
      setDestinationMode("stud");
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
        {ar ? "إنشاء شحنة سائل منوي جديدة" : "Create semen shipment"}
      </h2>
      <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <FormSection
            title={ar ? "الدفع والتسليم" : "Delivery details"}
            icon={<Truck className="h-4 w-4" />}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#f5f1ed] p-1">
                <button
                  type="button"
                  onClick={() => setDestinationMode("stud")}
                  className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-bold transition ${destinationMode === "stud" ? "bg-white text-[#4b2f1a] shadow-sm" : "text-[#81746a]"}`}
                >
                  <Building2 className="h-4 w-4" />
                  {t("shipment.chooseStud")}
                </button>
                <button
                  type="button"
                  onClick={() => setDestinationMode("manual")}
                  className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-bold transition ${destinationMode === "manual" ? "bg-white text-[#4b2f1a] shadow-sm" : "text-[#81746a]"}`}
                >
                  <PencilLine className="h-4 w-4" />
                  {t("shipment.manualAddress")}
                </button>
              </div>

              {destinationMode === "stud" ? (
                <>
                  <FormField label={t("shipment.destinationStud")} required>
                    <ExternalStudPicker
                      value={selectedStud?.id ?? null}
                      selectedLabel={selectedStudName}
                      onChange={setSelectedStud}
                      triggerClassName="min-h-[42px] rounded-[7px] border-[#ddd6cf] py-2 text-xs"
                    />
                  </FormField>
                  {selectedStud ? (
                    <div className="rounded-xl border border-[#dce4cc] bg-[#f5f8ed] p-3 text-xs text-[#59603f]">
                      <p className="font-bold">{selectedStudName}</p>
                      <p className="mt-1">{[selectedStud.city, selectedStud.country].filter(Boolean).join(" · ") || t("shipment.locationFromStud")}</p>
                      {selectedStud.xCor != null && selectedStud.yCor != null ? (
                        <p className="mt-1 font-mono" dir="ltr">{selectedStud.yCor}, {selectedStud.xCor}</p>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <FormField label={t("shipment.deliveryAddress")} required>
                    <textarea
                      required
                      name="Destination"
                      rows={3}
                      placeholder={t("shipment.deliveryAddressPlaceholder")}
                      className={`${fieldClass} h-auto py-3`}
                    />
                  </FormField>
                  <FormField label={t("shipment.cityOptional")}>
                    <input name="City" className={fieldClass} />
                  </FormField>
                </>
              )}
              <FormField label={ar ? "اسم المستلم" : "Recipient"}>
                <input name="RecipientName" className={fieldClass} />
              </FormField>
              <FormField label={ar ? "اسم العميل" : "Customer"}>
                <input name="CustomerName" className={fieldClass} />
              </FormField>
            </div>
          </FormSection>
          <FormSection
            title={t("shipment.locationHandling")}
            icon={<MapPin className="h-4 w-4" />}
            tone="sage"
          >
            <p className="text-xs leading-5 text-[#667050]">
              {destinationMode === "stud" ? t("shipment.studCoordinatesHelp") : t("shipment.manualAddressHelp")}
            </p>
          </FormSection>
        </aside>
        <div className="space-y-3">
          <FormSection title={ar ? "المعلومات الأساسية" : "Basic information"}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label={ar ? "اسم الفحل" : "Stallion"}>
                <div className={`${fieldClass} flex items-center`}>
                  {ar
                    ? profile.arabicName || profile.englishName
                    : profile.englishName || profile.arabicName}
                </div>
              </FormField>
              <FormField
                label={ar ? "تاريخ بداية الشحنة" : "Shipment date"}
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
                label={ar ? "الطبيب / المسؤول" : "Responsible person"}
                required
              >
                <input
                  required
                  name="VeterinarianName"
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "حالة الشحنة" : "Shipment status"}>
                <select name="Status" className={fieldClass}>
                  <option value="1">
                    {ar ? "قيد التجهيز" : "Preparing"}
                  </option>
                  <option value="2">{ar ? "مجدولة" : "Scheduled"}</option>
                  <option value="3">{ar ? "عاجلة" : "Urgent"}</option>
                </select>
              </FormField>
            </div>
          </FormSection>
          <FormSection
            title={ar ? "التفاصيل الفنية" : "Technical details"}
            icon={<FlaskConical className="h-4 w-4" />}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label={ar ? "التركيز" : "Concentration"}>
                <input
                  required
                  name="Concentration"
                  type="number"
                  step="0.1"
                  className={fieldClass}
                />
              </FormField>
              <FormField
                label={ar ? "الحركة التقدمية %" : "Progressive motility %"}
              >
                <input
                  required
                  name="ProgressiveMotility"
                  type="number"
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "نوع التخزين" : "Storage"}>
                <select name="StorageType" className={fieldClass}>
                  <option value="1">{ar ? "طازج" : "Fresh"}</option>
                  <option value="2">{ar ? "مبرد" : "Cooled"}</option>
                  <option value="3">{ar ? "مجمد" : "Frozen"}</option>
                </select>
              </FormField>
            </div>
          </FormSection>
          <FormSection title={ar ? "ملاحظات خاصة" : "Special notes"}>
            <textarea
              name="VeterinarianComments"
              rows={4}
              className={`${fieldClass} h-auto py-3`}
            />
          </FormSection>
        </div>
      </div>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      <BilledServiceFields locale={locale} />
      <FormActions
        locale={locale}
        saving={saving}
        title={ar ? "شحنة سائل منوي جديدة" : "New semen shipment"}
      />
    </form>
  );
}
