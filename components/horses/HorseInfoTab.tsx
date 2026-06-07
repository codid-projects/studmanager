"use client";

import { FC } from "react";
import { Dna, GitBranch } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localizeColor, localizeCountry } from "@/lib/api/localization";
import { localizeGender } from "@/lib/api/horse-formatters";
import type { HorseInfoDto } from "@/lib/api/types";

interface HorseInfoTabProps {
  horse?: {
    birthDate?: string;
    raw?: HorseInfoDto;
  };
}

function PedigreeDetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[22px] border border-[#e7d9cd] bg-gradient-to-br from-white to-[#faf5ef] p-5 shadow-[0_8px_24px_rgba(91,53,24,0.06)]">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#3d2a1b] text-white shadow-sm">
        {icon}
      </span>
      <div className="min-w-0">
        <span className="block text-xs font-bold text-[#9a806d]">{label}</span>
        <span className="mt-1 block truncate text-lg font-bold text-[#2f2118]" title={value}>
          {value}
        </span>
      </div>
    </div>
  );
}

export const HorseInfoTab: FC<HorseInfoTabProps> = ({ horse }) => {
  const { direction, locale } = useLocale();
  const isRTL = direction === "rtl";
  const raw: Partial<HorseInfoDto> = horse?.raw ?? {};
  const clean = (input?: string | null) => input?.trim() || "";
  const localized = (ar?: string | null, en?: string | null) =>
    locale === "ar" ? clean(ar) || clean(en) || "-" : clean(en) || clean(ar) || "-";
  const value = (input?: string | null) => clean(input) || "-";
  const country = (input?: string | null) => localizeCountry(input, locale === "ar" ? "ar" : "en");
  const color = (input?: string | null) => localizeColor(input, locale === "ar" ? "ar" : "en");
  const gender = (input?: string | null) => localizeGender(input, locale === "ar" ? "ar" : "en");
  const studName = (stud?: HorseInfoDto["owner"]) => localized(stud?.studArabicName, stud?.studName);
  const strain = localized(raw?.strainAr, raw?.strainEn);
  const line = localized(
    raw?.lineAr ?? raw?.specialAr,
    raw?.lineEn ?? raw?.specialEn,
  );

  return (
    <div className={`mb-12 ${isRTL ? "text-right" : "text-left"}`}>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PedigreeDetailCard
          icon={<Dna className="h-5 w-5" />}
          label={isRTL ? "الرسن" : "Strain"}
          value={strain}
        />
        <PedigreeDetailCard
          icon={<GitBranch className="h-5 w-5" />}
          label={isRTL ? "الخط" : "Line"}
          value={line}
        />
      </div>

      {/* Container for Info */}
      <div className="bg-[#fdfbf7] rounded-3xl p-8 md:p-12 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* Column 1: Horse Info */}
        <div className="flex flex-col gap-6">
          <h3 className="text-xl font-bold text-[#2a2a2a] mb-2">{isRTL ? "معلومات الحصان" : "Horse Information"}</h3>
          
          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "الاسم :" : "Name :"}</span>
            <span className="text-black font-semibold">{localized(raw?.arabicName, raw?.englishName)}</span>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "الاسم المعروف :" : "Known As :"}</span>
            <span className="text-black font-semibold">{value(raw?.knownAs)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "الرسن :" : "Strain :"}</span>
            <span className="text-black font-semibold">{strain}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "الخط :" : "Line :"}</span>
            <span className="text-black font-semibold">{line}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "حاليا في :" : "Currently In :"}</span>
            <span className="text-black font-semibold">{country(raw?.currentlyIn)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "الجنس :" : "Gender :"}</span>
            <span className="text-black font-semibold">{gender(raw?.gender)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "اللون :" : "Color :"}</span>
            <span className="text-black font-semibold">{color(raw?.color)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "تاريخ الميلاد :" : "Birth Date :"}</span>
            <span className="text-black font-semibold">{horse?.birthDate || "-"}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#a08a6b] font-medium">{isRTL ? "ولد في :" : "Born In :"}</span>
            <span className="text-black font-semibold">{country(raw?.bornIn)}</span>
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
