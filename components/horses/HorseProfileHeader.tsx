"use client";

import { FC, useState } from "react";
import Image from "next/image";
import { useLocale } from "@/lib/locale-context";
import { useRouter } from "next/navigation";
import horsePlaceholder from "@/app/assets/imgs/horse-placehodler.png";

interface Horse {
  id: string;
  nameAr: string;
  nameEn: string;
  type: string;
  gender: string;
  birthDate: string;
  features: number;
  image: string;
}

interface HorseProfileHeaderProps {
  horse: Horse;
}

export const HorseProfileHeader: FC<HorseProfileHeaderProps> = ({ horse }) => {
  const { locale, direction } = useLocale();
  const isRTL = direction === "rtl";
  const [coverSrc, setCoverSrc] = useState<string | typeof horsePlaceholder>(
    horse.image || horsePlaceholder,
  );
  const [avatarSrc, setAvatarSrc] = useState<string | typeof horsePlaceholder>(
    horse.image || horsePlaceholder,
  );

  const horseName = locale === "ar" ? horse.nameAr : horse.nameEn;
  const router = useRouter();

  return (
    <div className="mb-8">
      {/* Cover Image & Avatar Container */}
      <div className="relative mb-16">
        {/* Cover */}
        <div className="relative w-full h-80 rounded-3xl overflow-hidden shadow-sm">
          <Image
            src={coverSrc}
            alt={horseName}
            fill
            className="object-cover"
            onError={() => setCoverSrc(horsePlaceholder)}
          />
        </div>

        {/* Avatar overlapping the bottom edge */}
        <div className={`absolute -bottom-16 ${isRTL ? "right-12" : "left-12"} w-40 h-40 rounded-full border-4 border-[#fdfbf7] overflow-hidden bg-white shadow-md z-10`}>
          <Image
            src={avatarSrc}
            alt={horseName}
            fill
            className="object-cover"
            onError={() => setAvatarSrc(horsePlaceholder)}
          />
        </div>
      </div>

      {/* Info Context Below Cover */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center px-4 md:px-12`}>
        {/* Name Area */}
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl md:text-4xl font-bold text-[#2a2a2a]">
            {horseName}
          </h1>
        </div>

        {/* Action Area */}
        <div>
          <button
            onClick={() => router.push(`/${locale}/horses/${horse.id}/mating-test`)}
            className="flex items-center gap-2 px-6 py-3 bg-[#3d2a1b] text-white rounded-xl hover:bg-[#2c1f14] transition-colors font-semibold text-lg"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="14" r="5" />
              <line x1="14" y1="10" x2="19" y2="5" />
              <line x1="15" y1="5" x2="19" y2="5" />
              <line x1="19" y1="9" x2="19" y2="5" />
            </svg>
            <span>{isRTL ? "إختبار التزاوج" : "Mating Test"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
