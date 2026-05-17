"use client";

import { useLocale } from "@/lib/locale-context";
import { X, Calendar, ChevronDown, Phone, Trash2, FileIcon } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

type ModalType = "add" | "edit" | "delete" | null;

interface BloodTestModalsProps {
  isOpen: boolean;
  type: ModalType;
  onClose: () => void;
  recordData?: any; // For edit modal pre-population
  categoryTitle?: string;
}

export const BloodTestModals = ({ isOpen, type, onClose, recordData, categoryTitle }: BloodTestModalsProps) => {
  const { direction } = useLocale();

  const [fileName] = useState<string | null>(recordData?.fileName || null);
  const [isPositive, setIsPositive] = useState<boolean>(recordData?.isPositive ?? false);

  if (!isOpen || !type) return null;

  // Handle Delete Modal specifically which has a very different layout
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
          <h2 className="mb-3 text-center font-cairo text-2xl font-bold text-[#2b2a3f] sm:text-3xl">حذف السجل؟</h2>
          <p className="mb-8 text-center text-sm font-medium text-gray-500 sm:mb-10">لن تتمكن من استعادة هذا السجل</p>
          
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:gap-4">
            <button 
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-300 py-3.5 font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button 
              className="flex-1 rounded-xl bg-[#b62424] py-3.5 font-bold text-white transition-colors hover:bg-[#9a1a1a]"
            >
              حذف
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine Title based on add vs edit
  const fallbackTitle = categoryTitle || "تحليل الدم";
  const modalTitle = type === "add" ? `سجل جديد ل${fallbackTitle}` : `تعديل سجل ${fallbackTitle}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-3 sm:p-4"
      dir={direction}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative my-3 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white font-cairo shadow-xl sm:my-8 sm:max-h-[calc(100dvh-4rem)] sm:rounded-3xl">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-8 sm:py-6">
          <div className="flex min-w-0 items-center gap-3">
             {/* Small icon from screenshot */}
             <div className="relative h-8 w-8 shrink-0">
               <Image src="/health/تحاليل الدم.svg" alt="icon" fill className="object-contain" />
             </div>
             <h2 className="text-lg font-bold leading-tight text-[#2b2a3f] sm:text-2xl">{modalTitle}</h2>
          </div>
          <button 
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:gap-y-6 md:grid-cols-2">
          
          {/* Row 1 */}
          <div className="relative">
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-gray-400" />
             </div>
             <select className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-gray-700 outline-none focus:border-[#4b2f1a] sm:py-4" dir={direction}>
               <option disabled selected>{type === "edit" ? "مداح مهنا" : "اختر الخيل"}</option>
               <option>مداح مهنا</option>
               <option>خيار آخر</option>
             </select>
          </div>
          
          <div className="relative">
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Calendar className="w-5 h-5 text-gray-400" />
             </div>
             <input 
               type="text" 
               placeholder={type === "edit" ? "18/9/2025" : "تاريخ سحب العينة"}
               defaultValue={type === "edit" ? "18/9/2025" : ""}
               className="w-full rounded-xl border border-gray-300 bg-white px-12 py-3.5 text-right text-gray-700 outline-none placeholder-gray-400 focus:border-[#4b2f1a] sm:py-4"
             />
          </div>

          {/* Row 2 */}
          <div className="relative">
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-gray-400" />
             </div>
             <select className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-gray-700 outline-none focus:border-[#4b2f1a] sm:py-4" dir={direction}>
               <option disabled selected>اسم المختبر</option>
               <option>مختبر ألفا</option>
             </select>
          </div>

          <div className="relative">
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-gray-400" />
             </div>
             <select className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-gray-700 outline-none focus:border-[#4b2f1a] sm:py-4" dir={direction}>
               <option disabled selected>سبب سحب العينة</option>
               <option>فحص دوري</option>
             </select>
          </div>

          {/* Row 3 */}
          <div className="relative">
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Phone className="w-5 h-5 text-gray-400" />
             </div>
             <input 
               type="text" 
               placeholder={type === "edit" ? "01010101010" : "رقم المتابعة"}
               defaultValue={type === "edit" ? "01010101010" : ""}
               className="w-full rounded-xl border border-gray-300 bg-white px-12 py-3.5 text-right text-gray-700 outline-none placeholder-gray-400 focus:border-[#4b2f1a] sm:py-4"
               dir="ltr"
             />
          </div>
          
          <div className="relative">
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Calendar className="w-5 h-5 text-gray-400" />
             </div>
             <input 
               type="text" 
               placeholder={type === "edit" ? "18/9/2026" : "أخطرنى فى"}
               defaultValue={type === "edit" ? "18/9/2026" : ""}
               className="w-full rounded-xl border border-gray-300 bg-white px-12 py-3.5 text-right text-gray-700 outline-none placeholder-gray-400 focus:border-[#4b2f1a] sm:py-4"
             />
          </div>

        </div>
        
        {/* Full Width Row */}
        <div className="relative mb-6 sm:mb-8">
           <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <span className="font-bold text-gray-400">$</span>
           </div>
           <input 
             type="text" 
             placeholder={type === "edit" ? "200$" : "التكلفة"}
             defaultValue={type === "edit" ? "200$" : ""}
             className="w-full rounded-xl border border-gray-300 bg-white px-12 py-3.5 text-right text-gray-700 outline-none placeholder-gray-400 focus:border-[#4b2f1a] sm:py-4"
           />
        </div>

        {/* Radio and Upload Section */}
        <div className="mb-8 flex flex-col items-end gap-5 sm:mb-12 sm:gap-6">
            
            <div className="flex w-full flex-col items-end gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
              <span className="text-right font-semibold text-[#2b2a3f]">هل هو إيجابي ؟</span>
              <div className="flex items-center gap-4 sm:gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-gray-700">نعم</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isPositive ? 'border-[#3b2b20]' : 'border-gray-300'}`}>
                     {isPositive && <div className="w-2.5 h-2.5 bg-[#3b2b20] rounded-full" />}
                  </div>
                  <input type="radio" className="hidden" checked={isPositive} onChange={() => setIsPositive(true)} />
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-gray-700">لا</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${!isPositive ? 'border-[#3b2b20]' : 'border-gray-300'}`}>
                     {!isPositive && <div className="w-2.5 h-2.5 bg-[#3b2b20] rounded-full" />}
                  </div>
                  <input type="radio" className="hidden" checked={!isPositive} onChange={() => setIsPositive(false)} />
                </label>
              </div>
            </div>

            <div className="flex w-full flex-col items-end gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
               {fileName ? (
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <FileIcon className="w-4 h-4" />
                    {fileName}
                  </span>
               ) : <span className="text-sm text-gray-400">لم يتم اختيار ملف</span>}
               
               <button className="w-full rounded-xl border border-[#3b2b20] bg-[#faf8f5] px-6 py-3 font-bold text-[#3b2b20] transition-colors hover:bg-[#f3eee6] sm:w-auto">
                 اختر ملف
               </button>
               
               <span className="text-right text-xs text-gray-400">يرجى تحميل ملف بحجم أقل من 2 ميجا بايت</span>
            </div>
        </div>
        
        {/* Footer Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-start sm:gap-4">
           <button 
             onClick={onClose}
             className="w-full rounded-xl border border-gray-300 px-6 py-3.5 font-bold text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto sm:px-10"
           >
             إلغاء
           </button>
           <button 
             className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3b2b20] px-6 py-3.5 font-bold text-white transition-colors hover:bg-[#2e2119] sm:w-auto sm:px-10"
           >
             حفظ
           </button>
        </div>
        </div>

      </div>
    </div>
  );
};
