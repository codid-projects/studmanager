"use client";

import { FC } from "react";
import { useLocale } from "@/lib/locale-context";

interface HorseInfoTabProps {
  horse?: any;
}

export const HorseInfoTab: FC<HorseInfoTabProps> = ({ horse }) => {
  const { direction, locale } = useLocale();
  const isRTL = direction === "rtl";
  const raw = horse?.raw ?? {};
  const localized = (ar?: string | null, en?: string | null) =>
    locale === "ar" ? ar || en || "-" : en || ar || "-";
  const value = (input?: string | null) => input || "-";
  const studName = (stud?: any) => localized(stud?.studArabicName, stud?.studName);

  return (
    <div className={`mb-12 ${isRTL ? "text-right" : "text-left"}`}>
      {/* Container for Info */}
      <div className="bg-[#fdfbf7] rounded-3xl p-8 md:p-12 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* Column 1: Horse Info */}
        <div className="flex flex-col gap-6">
          <h3 className="text-xl font-bold text-[#2a2a2a] mb-2">{isRTL ? "معلومات الحصان" : "Horse Information"}</h3>
          
          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "الاسم :" : "Name :"}</span>
            <span className="text-black font-semibold">{localized(raw.arabicName, raw.englishName)}</span>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "الاسم المعروف :" : "Known As :"}</span>
            <span className="text-black font-semibold">{value(raw.knownAs)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "السلالة :" : "Strain :"}</span>
            <span className="text-black font-semibold">{localized(raw.strainAr, raw.strainEn)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "حاليا في :" : "Currently In :"}</span>
            <span className="text-black font-semibold">{value(raw.currentlyIn)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "الجنس :" : "Gender :"}</span>
            <span className="text-black font-semibold">{value(raw.gender)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "اللون :" : "Color :"}</span>
            <span className="text-black font-semibold">{value(raw.color)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "تاريخ الميلاد :" : "Birth Date :"}</span>
            <span className="text-black font-semibold">{horse?.birthDate || "-"}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "ولد في :" : "Born In :"}</span>
            <span className="text-black font-semibold">{value(raw.bornIn)}</span>
          </div>
        </div>

        {/* Column 2: Registration Numbers */}
        <div className="flex flex-col gap-6">
          <h3 className="text-xl font-bold text-[#2a2a2a] mb-2">{isRTL ? "أرقام التسجيل" : "Registration Numbers"}</h3>
          
          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "أرقام التسجيل :" : "Registration No :"}</span>
            <span className="text-black font-semibold">{value(raw.registrationNumber)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "رقم الشريحة :" : "Microchip No :"}</span>
            <span className="text-black font-semibold">{value(raw.microchipID)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "رقم UELN :" : "UELN No :"}</span>
            <span className="text-black font-semibold">{value(raw.uelnNumber)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "رقم تسجيل الاتحاد الدولي للفروسية :" : "FEI Registration :"}</span>
            <span className="text-black font-semibold">{value(raw.internationalFEIRegistrationNumber)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "رقم تسجيل الرياضي المحلي :" : "Local Registration :"}</span>
            <span className="text-black font-semibold">{value(raw.nationalSportRegistrationNumber)}</span>
          </div>
        </div>

        {/* Column 3: Breeder Information */}
        <div className="flex flex-col gap-6">
          <h3 className="text-xl font-bold text-[#2a2a2a] mb-2">{isRTL ? "معلومات المربي" : "Breeder Information"}</h3>
          
          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "اسم المربي :" : "Breeder Name :"}</span>
            <span className="text-black font-semibold">{studName(raw.breeder)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "البريد الإلكتروني :" : "Email :"}</span>
            <span className="text-black font-semibold">{value(raw.breeder?.studEmail)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "رقم الهاتف :" : "Phone Number :"}</span>
            <span className="text-black font-semibold">{value(raw.breeder?.primaryPhoneNumber)}</span>
          </div>
        </div>

        {/* Column 4: Owner Information */}
        <div className="flex flex-col gap-6">
          <h3 className="text-xl font-bold text-[#2a2a2a] mb-2">{isRTL ? "معلومات المالك الحالي" : "Current Owner Info"}</h3>
          
          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "اسم المالك :" : "Owner Name :"}</span>
            <span className="text-black font-semibold">{studName(raw.owner)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "البريد الإلكتروني :" : "Email :"}</span>
            <span className="text-black font-semibold">{value(raw.owner?.studEmail)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "رقم الهاتف :" : "Phone Number :"}</span>
            <span className="text-black font-semibold">{value(raw.owner?.primaryPhoneNumber)}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
