"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { LocaleCode } from "@/lib/api/types";
import { fieldClass, FormField, FormSection } from "./FormPrimitives";

export type ExistingBilledService = {
  id: number;
  serviceName: string;
  totalPrice: number;
};

// Name of the hidden input <BilledServiceFields> writes. It carries the full
// list of rows as JSON so a single FormData read reconstructs every service.
export const BILLED_SERVICES_FIELD = "BilledServicesPayload";

type PayloadRow = { id: number | null; serviceName: string; unitPrice: string };

function readRows(data: FormData): PayloadRow[] {
  const raw = data.get(BILLED_SERVICES_FIELD);
  data.delete(BILLED_SERVICES_FIELD);
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serialize(name: string, serviceType: string, unitPrice: number) {
  return JSON.stringify({
    serviceName: name.trim() || serviceType,
    serviceType,
    quantity: 1,
    unitPrice,
  });
}

/**
 * Create flow: every row with a positive price becomes a new entry in the
 * backend's BilledServicesJsonList (List<string>), so a record can be created
 * with any number of billed services.
 */
export function appendBilledService(data: FormData, serviceType: string) {
  for (const row of readRows(data)) {
    const price = Number(row.unitPrice || 0);
    if (price > 0)
      data.append("BilledServicesJsonList", serialize(row.serviceName, serviceType, price));
  }
}

/**
 * Update flow: reconcile the edited list against the backend keep-list contract
 * (BaseBreedingRecordUpdateDto):
 *   - BilledServiceIdsToKeep: existing rows to preserve (anything missing is
 *     deleted by the backend).
 *   - BilledServicesJsonList: brand-new rows to add.
 * Existing rows left untouched are kept by id; an edited row is delete+re-added
 * (the backend can't update a billed row in place); a removed row is simply
 * dropped from both lists.
 */
export function appendBilledServiceUpdate(
  data: FormData,
  serviceType: string,
  existing?: ExistingBilledService[],
) {
  const byId = new Map((existing ?? []).map((service) => [service.id, service]));
  for (const row of readRows(data)) {
    const price = Number(row.unitPrice || 0);
    const name = (row.serviceName || "").trim() || serviceType;

    if (row.id != null) {
      const original = byId.get(row.id);
      const unchanged =
        original != null &&
        price > 0 &&
        name === original.serviceName &&
        price === original.totalPrice;
      if (unchanged) {
        data.append("BilledServiceIdsToKeep", String(row.id));
      } else if (price > 0) {
        data.append("BilledServicesJsonList", serialize(row.serviceName, serviceType, price));
      }
      // price cleared to 0 → row removed (not kept, not re-added).
    } else if (price > 0) {
      data.append("BilledServicesJsonList", serialize(row.serviceName, serviceType, price));
    }
  }
}

type Row = { key: string; id: number | null; serviceName: string; unitPrice: string };

let rowSeq = 0;
const nextKey = () => `bs-${rowSeq++}`;

function toRows(initial?: ExistingBilledService[]): Row[] {
  if (initial && initial.length > 0)
    return initial.map((service) => ({
      key: nextKey(),
      id: service.id,
      serviceName: service.serviceName ?? "",
      unitPrice: service.totalPrice != null ? String(service.totalPrice) : "",
    }));
  return [{ key: nextKey(), id: null, serviceName: "", unitPrice: "" }];
}

export function BilledServiceFields({
  locale,
  initial,
}: {
  locale: LocaleCode;
  initial?: ExistingBilledService[];
}) {
  const ar = locale === "ar";
  const [rows, setRows] = useState<Row[]>(() => toRows(initial));

  const patch = (key: string, change: Partial<Row>) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...change } : row)),
    );
  const addRow = () =>
    setRows((current) => [
      ...current,
      { key: nextKey(), id: null, serviceName: "", unitPrice: "" },
    ]);
  const removeRow = (key: string) =>
    setRows((current) =>
      current.length > 1
        ? current.filter((row) => row.key !== key)
        : current.map((row) =>
            row.key === key ? { ...row, serviceName: "", unitPrice: "" } : row,
          ),
    );

  const payload = JSON.stringify(
    rows.map((row) => ({
      id: row.id,
      serviceName: row.serviceName,
      unitPrice: row.unitPrice,
    })),
  );

  return (
    <FormSection title={ar ? "تفاصيل التكلفة" : "Cost details"} tone="sage">
      <input type="hidden" name={BILLED_SERVICES_FIELD} value={payload} readOnly />
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label={ar ? "اسم الخدمة" : "Service name"}>
                <input
                  value={row.serviceName}
                  onChange={(event) =>
                    patch(row.key, { serviceName: event.target.value })
                  }
                  className={fieldClass}
                />
              </FormField>
              <FormField label={ar ? "القيمة بالجنيه المصري" : "Amount (EGP)"}>
                <div className="relative">
                  <input
                    value={row.unitPrice}
                    onChange={(event) =>
                      patch(row.key, { unitPrice: event.target.value })
                    }
                    min="0"
                    step="any"
                    type="number"
                    className={`${fieldClass} pe-14`}
                  />
                  <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#846f62]">
                    EGP
                  </span>
                </div>
              </FormField>
            </div>
            <button
              type="button"
              onClick={() => removeRow(row.key)}
              aria-label={ar ? "حذف الخدمة" : "Remove service"}
              className="mb-1 grid h-10 w-10 place-items-center rounded-[8px] border border-[#e2dcd4] text-[#9a3b3b] hover:bg-[#fbeeee]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-3 inline-flex items-center gap-1.5 rounded-[8px] border border-dashed border-[#c2b9ad] px-3 py-2 text-[11px] font-bold text-[#5b4a3b] hover:bg-white"
      >
        <Plus className="h-4 w-4" />
        {ar ? "إضافة خدمة أخرى" : "Add another service"}
      </button>
    </FormSection>
  );
}
