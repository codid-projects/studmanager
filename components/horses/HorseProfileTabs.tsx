"use client";

import { FC } from "react";
import Image from "next/image";
import { useLocale } from "@/lib/locale-context";

const TABS = [
  { id: "pedigree", labelAr: "الأنساب", labelEn: "Pedigree", icon: "/horse/انساب.svg", activeIcon: "/horse/انساب.svg", inactiveIcon: "/horse/انساب-notactive.svg" },
  { id: "analytics", labelAr: "التحليلات", labelEn: "Analytics", icon: "/horse/معلومات.svg" },
  { id: "info", labelAr: "معلومات", labelEn: "Info", icon: "/horse/معلومات.svg" },
  { id: "photos", labelAr: "صور", labelEn: "Photos", icon: "/horse/صور.svg" },
  { id: "videos", labelAr: "فيديوهات", labelEn: "Videos", icon: "/horse/فيديوهات.svg" },
  { id: "children", labelAr: "الأبناء", labelEn: "Children", icon: "/horse/الأبناء.svg" },
  { id: "siblings", labelAr: "الأشقاء", labelEn: "Siblings", icon: "/horse/الأشقاء.svg" },
  { id: "competition", labelAr: "المنافسة", labelEn: "Competition", icon: "/horse/المنافسه.svg" },
];

interface HorseProfileTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  hiddenTabs?: string[];
}

export const HorseProfileTabs: FC<HorseProfileTabsProps> = ({ activeTab, onTabChange, hiddenTabs = [] }) => {
  const { locale } = useLocale();

  return (
    <div className="flex overflow-x-auto items-center gap-2 mb-8 pb-2 hide-scrollbar scroll-smooth sm:flex-wrap sm:overflow-visible sm:pb-0">
      {TABS.filter((tab) => !hiddenTabs.includes(tab.id)).map((tab) => {
        const isActive = activeTab === tab.id;
        const label = locale === "ar" ? tab.labelAr : tab.labelEn;
        const currentIcon = isActive ? (tab.activeIcon || tab.icon) : (tab.inactiveIcon || tab.icon);
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-shrink-0 items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors
              ${isActive 
                ? "bg-[#3d2a1b] text-white" 
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-100"
              }`}
          >
            <div className={`relative w-5 h-5 ${isActive && !tab.activeIcon ? "brightness-0 invert" : ""}`}>
              <Image 
                src={currentIcon} 
                alt={label} 
                fill 
                className="object-contain"
              />
            </div>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};
