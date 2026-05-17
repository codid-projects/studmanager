"use client";

import { useLocale } from "@/lib/locale-context";
import { X, Calendar, ChevronDown, Phone, Trash2 } from "lucide-react";
import Image from "next/image";
import arTranslations from "@/public/locales/ar.json";
import enTranslations from "@/public/locales/en.json";

type ModalType = "add" | "edit" | "delete" | null;

interface NutritionModalsProps {
  isOpen: boolean;
  type: ModalType;
  onClose: () => void;
  recordData?: any;
  categoryTitle?: string;
}

export const NutritionModals = ({
  isOpen,
  type,
  onClose,
  recordData: _recordData,
  categoryTitle,
}: NutritionModalsProps) => {
  const { direction, locale } = useLocale();

  if (!isOpen || !type) return null;

  const isRTL = direction === "rtl";
  const lang: "ar" | "en" = locale === "en" || direction === "ltr" ? "en" : "ar";
  const t = (lang === "ar" ? arTranslations : enTranslations).nutritionModals;

  const fallbackTitle = categoryTitle || t.defaultCategory;
  const addRecordTitle = t.addRecord.replace("{{cat}}", fallbackTitle);
  const editRecordTitle = t.editRecord.replace("{{cat}}", fallbackTitle);

  if (type === "delete") {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 p-3 sm:p-4"
        dir={direction}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="relative flex w-full max-w-sm flex-col items-center rounded-[28px] bg-white p-6 shadow-xl sm:rounded-[32px] sm:p-10">
          <div className="mb-5 h-20 w-20 text-[#c53b3b] sm:mb-6 sm:h-24 sm:w-24">
            <Trash2 className="w-full h-full stroke-1" />
          </div>
          <h2 className="mb-3 text-center font-cairo text-2xl font-bold text-[#2b2a3f] sm:text-3xl">
            {t.deleteTitle}
          </h2>
          <p className="mb-8 text-center text-sm font-medium text-gray-500 sm:mb-10">
            {t.deleteSubtitle}
          </p>
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:gap-4">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-300 py-3.5 font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t.cancel}
            </button>
            <button className="flex-1 rounded-xl bg-[#b62424] py-3.5 font-bold text-white transition-colors hover:bg-[#9a1a1a]">
              {t.delete}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const modalTitle = type === "add" ? addRecordTitle : editRecordTitle;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-3 sm:p-4"
      dir={direction}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative my-3 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white font-cairo shadow-xl sm:my-8 sm:max-h-[calc(100dvh-4rem)] sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-8 sm:py-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-8 w-8 shrink-0">
              <Image
                src="/nutrition/تغييرات الأعلاف.svg"
                alt="icon"
                fill
                className="object-contain"
              />
            </div>
            <h2 className="text-lg font-bold leading-tight text-[#2b2a3f] sm:text-2xl">
              {modalTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:gap-y-6 md:grid-cols-2">
          <div className="relative">
            <div className={`absolute ${isRTL ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 pointer-events-none z-10`}>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </div>
            <select
              className={`w-full appearance-none rounded-xl border border-gray-300 bg-white py-3.5 text-gray-700 outline-none focus:border-[#4b2f1a] sm:py-4 ${isRTL ? "pr-4 pl-10 text-right" : "pl-4 pr-10 text-left"}`}
              dir={direction}
            >
              <option disabled selected>
                {type === "edit" ? "مداح مهنا" : t.selectHorse}
              </option>
              <option>مداح مهنا</option>
            </select>
          </div>

          <div className="relative">
            <div className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 pointer-events-none z-10`}>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={type === "edit" ? "04/7/2025" : t.changeDate}
              defaultValue={type === "edit" ? "04/7/2025" : ""}
              className={`w-full rounded-xl border border-gray-300 bg-white py-3.5 text-gray-700 outline-none placeholder-gray-400 focus:border-[#4b2f1a] font-inter sm:py-4 ${isRTL ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"}`}
            />
          </div>


          <div className="relative">
            <div className={`absolute ${isRTL ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 pointer-events-none z-10`}>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </div>
            <select
              className={`w-full appearance-none rounded-xl border border-gray-300 bg-white py-3.5 text-gray-700 outline-none focus:border-[#4b2f1a] sm:py-4 ${isRTL ? "pr-4 pl-10 text-right" : "pl-4 pr-10 text-left"}`}
              dir={direction}
            >
              <option disabled selected>{t.feedType}</option>
              <option>{t.feedType}</option>
            </select>
          </div>


          <div className="relative">
            <div className={`absolute ${isRTL ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 pointer-events-none z-10`}>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </div>
            <select
              className={`w-full appearance-none rounded-xl border border-gray-300 bg-white py-3.5 text-gray-700 outline-none focus:border-[#4b2f1a] sm:py-4 ${isRTL ? "pr-4 pl-10 text-right" : "pl-4 pr-10 text-left"}`}
              dir={direction}
            >
              <option disabled selected>
                {type === "edit" ? "50 كجم" : t.quantity}
              </option>
              <option>50 كجم</option>
            </select>
          </div>


          <div className="relative">
            <div className={`absolute ${isRTL ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 pointer-events-none z-10`}>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </div>
            <select
              className={`w-full appearance-none rounded-xl border border-gray-300 bg-white py-3.5 text-gray-700 outline-none focus:border-[#4b2f1a] sm:py-4 ${isRTL ? "pr-4 pl-10 text-right" : "pl-4 pr-10 text-left"}`}
              dir={direction}
            >
              <option disabled selected>{t.supplierName}</option>
              <option>{lang === "ar" ? "مورد الرياض" : "Riyadh Supplier"}</option>
            </select>
          </div>


          <div className="relative">
            <div className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 pointer-events-none z-10`}>
              <Phone className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t.supplierNumber}
              className={`w-full rounded-xl border border-gray-300 bg-white py-3.5 text-gray-700 outline-none placeholder-gray-400 focus:border-[#4b2f1a] sm:py-4 ${isRTL ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"}`}
              dir="ltr"
            />
          </div>


          <div className="relative">
            <div className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 pointer-events-none z-10`}>
              <span className="font-bold text-gray-400">$</span>
            </div>
            <input
              type="text"
              placeholder={type === "edit" ? "200$" : t.cost}
              defaultValue={type === "edit" ? "200$" : ""}
              className={`w-full rounded-xl border border-gray-300 bg-white py-3.5 text-gray-700 outline-none placeholder-gray-400 focus:border-[#4b2f1a] font-inter sm:py-4 ${isRTL ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"}`}
            />
          </div>

          <div className="relative">
            <div className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 pointer-events-none z-10`}>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={type === "edit" ? "04/7/2026" : t.notifyMe}
              defaultValue={type === "edit" ? "04/7/2026" : ""}
              className={`w-full rounded-xl border border-gray-300 bg-white py-3.5 text-gray-700 outline-none placeholder-gray-400 focus:border-[#4b2f1a] font-inter sm:py-4 ${isRTL ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"}`}
            />
          </div>

        </div>


        <div className="mt-8 flex flex-col-reverse gap-3 sm:mt-12 sm:flex-row-reverse sm:items-center sm:gap-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-gray-300 px-6 py-3.5 font-bold text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto sm:px-10"
          >
            {t.cancel}
          </button>
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3b2b20] px-6 py-3.5 font-bold text-white transition-colors hover:bg-[#2e2119] sm:w-auto sm:px-10">
            {t.save}
          </button>
        </div>
        </div>

      </div>
    </div>
  );
};
