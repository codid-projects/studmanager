"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import type { SectionCategory } from "@/lib/section-categories";

interface CategoryTabsProps {
  /** Section base path segment, e.g. "performance" (links become /{locale}/{section}/{id}). */
  section: string;
  /** All sibling categories of the section. */
  categories: SectionCategory[];
  /** The currently open category id. */
  activeId: string;
}

/**
 * Horizontal, scrollable row of sibling-category tabs shown at the top of a
 * section detail page so the user can switch categories without going back to
 * the landing grid. Mirrors the pill-tab style used by HorseProfileTabs and is
 * RTL/LTR aware via the active locale.
 */
export function CategoryTabs({ section, categories, activeId }: CategoryTabsProps) {
  const { locale } = useLocale();
  const isRTL = locale === "ar";

  return (
    <div
      className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar scroll-smooth sm:flex-wrap sm:overflow-visible sm:pb-0"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {categories.map((category) => {
        const isActive = category.id === activeId;
        const label = isRTL ? category.labelAr : category.labelEn;

        return (
          <Link
            key={category.id}
            href={`/${locale}/${section}/${category.id}`}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 font-semibold transition-colors ${
              isActive
                ? "bg-[#3d2a1b] text-white"
                : "border border-gray-100 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className={`relative h-5 w-5 ${isActive ? "brightness-0 invert" : ""}`}>
              <Image src={category.icon} alt="" fill className="object-contain" />
            </div>
            <span className="whitespace-nowrap">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
