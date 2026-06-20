"use client";

import { FormEvent, useEffect, useState } from "react";
import { CircleDollarSign, Pencil, RotateCcw, UserRound, X } from "lucide-react";
import type { LocaleCode } from "@/lib/api/types";

export type HorseSalePayload = { isSold: boolean; soldTo?: string | null; soldPrice?: string | null };

export function HorseSaleModal({ open, locale, horseName, isSold, soldTo, soldPrice, soldAt, saving, error, onClose, onSave }: {
  open: boolean;
  locale: LocaleCode;
  horseName: string;
  isSold: boolean;
  soldTo?: string | null;
  soldPrice?: string | null;
  soldAt?: string | null;
  saving: boolean;
  error?: string;
  onClose: () => void;
  onSave: (payload: HorseSalePayload) => Promise<void>;
}) {
  const ar = locale === "ar";
  const [editing, setEditing] = useState(!isSold);
  const [buyer, setBuyer] = useState(soldTo ?? "");
  const [price, setPrice] = useState(soldPrice ?? "");

  useEffect(() => {
    if (!open) return;
    setEditing(!isSold);
    setBuyer(soldTo ?? "");
    setPrice(soldPrice ?? "");
  }, [isSold, open, soldPrice, soldTo]);

  if (!open) return null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave({ isSold: true, soldTo: buyer.trim(), soldPrice: price.trim() });
  }

  return <div className="fixed inset-0 z-[110] grid place-items-center bg-[#24150d]/55 p-4 backdrop-blur-[2px]" onMouseDown={event => event.target === event.currentTarget && !saving && onClose()} dir={ar ? "rtl" : "ltr"}>
    <section className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-[0_28px_90px_rgba(30,17,10,.35)]">
      <header className="flex items-center justify-between border-b border-[#eadfd8] px-5 py-4"><div><p className="text-[11px] text-[#927f73]">{horseName}</p><h2 className="text-xl font-bold text-[#352419]">{isSold && !editing ? (ar ? "تفاصيل البيع" : "Sale details") : (ar ? "تسجيل بيع الحصان" : "Record horse sale")}</h2></div><button disabled={saving} onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-[#e3d7cf]"><X className="h-5 w-5" /></button></header>
      {isSold && !editing ? <div className="space-y-3 p-5">
        <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[#f8f3ef] p-4"><UserRound className="mb-2 h-5 w-5 text-[#745443]"/><small className="text-[#8c7b71]">{ar ? "تم البيع إلى" : "Sold to"}</small><b className="mt-1 block text-[#352419]">{soldTo || "—"}</b></div><div className="rounded-xl bg-[#f2f7ed] p-4"><CircleDollarSign className="mb-2 h-5 w-5 text-[#527044]"/><small className="text-[#78866f]">{ar ? "قيمة البيع" : "Sale price"}</small><b className="mt-1 block text-[#35432e]">{soldPrice || "—"}</b></div></div>
        <p className="text-xs text-[#8b7c73]">{ar ? "تاريخ البيع" : "Sold on"}: {soldAt ? new Date(soldAt).toLocaleString(ar ? "ar-EG" : "en-GB") : "—"}</p>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 pt-2"><button disabled={saving} onClick={() => onSave({ isSold: false })} className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600"><RotateCcw className="h-4 w-4"/>{ar ? "إلغاء حالة البيع" : "Remove sale"}</button><button onClick={() => setEditing(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#351d10] px-5 text-sm font-semibold text-white"><Pencil className="h-4 w-4"/>{ar ? "تعديل" : "Edit"}</button></div>
      </div> : <form onSubmit={submit} className="space-y-4 p-5">
        <label className="block text-sm font-semibold text-[#4a382e]">{ar ? "تم البيع إلى" : "Sold to"}<input required maxLength={250} value={buyer} onChange={event => setBuyer(event.target.value)} placeholder={ar ? "اسم المشتري" : "Buyer name"} className="mt-2 h-12 w-full rounded-xl border border-[#d9cec6] px-4 outline-none focus:border-[#4b2d1c]" /></label>
        <label className="block text-sm font-semibold text-[#4a382e]">{ar ? "قيمة البيع" : "Sale price"}<input required maxLength={100} value={price} onChange={event => setPrice(event.target.value)} placeholder={ar ? "مثال: 250,000 جنيه" : "Example: EGP 250,000"} className="mt-2 h-12 w-full rounded-xl border border-[#d9cec6] px-4 outline-none focus:border-[#4b2d1c]" /></label>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">{isSold && <button type="button" onClick={() => setEditing(false)} className="h-11 rounded-xl border border-[#d8cbc2] px-4 text-sm font-semibold">{ar ? "إلغاء" : "Cancel"}</button>}<button disabled={saving} className="h-11 rounded-xl bg-[#351d10] px-6 text-sm font-semibold text-white disabled:opacity-50">{saving ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ البيع" : "Save sale")}</button></div>
      </form>}
    </section>
  </div>;
}
