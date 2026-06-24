"use client";

import { useCallback } from "react";
import { PaginatedPicker } from "@/components/common/PaginatedPicker";
import {
  normalizePagedList,
  searchExternalStuds,
} from "@/lib/api/external-horses";
import type { ExternalStudSearchItem, LocaleCode } from "@/lib/api/types";
import { useLocale, useTranslation } from "@/lib/locale-context";

interface ExternalStudPickerProps {
  value: number | null;
  selectedLabel?: string;
  onChange: (stud: ExternalStudSearchItem) => void;
  disabled?: boolean;
  triggerClassName?: string;
}

export function ExternalStudPicker({
  value,
  selectedLabel,
  onChange,
  disabled,
  triggerClassName,
}: ExternalStudPickerProps) {
  const { locale } = useLocale();
  const { t } = useTranslation();

  const fetchPage = useCallback(async ({
    search,
    pageNumber,
    pageSize,
  }: {
    search?: string;
    pageNumber: number;
    pageSize: number;
  }) => {
    const result = await searchExternalStuds({
      searchTerm: search,
      pageNumber,
      pageSize,
    });
    const page = normalizePagedList(result);
    return {
      data: page.items,
      currentPage: page.currentPage,
      hasNextPage: page.hasNextPage,
    };
  }, []);

  return (
    <PaginatedPicker
      value={value}
      selectedLabel={selectedLabel}
      placeholder={t("shipment.selectStud")}
      title={t("shipment.selectDestinationStud")}
      searchPlaceholder={t("shipment.searchStuds")}
      emptyText={t("shipment.noStudsFound")}
      fetchPage={fetchPage}
      getItemKey={(stud) => stud.id}
      getItemLabel={(stud) => locale === "ar"
        ? stud.studArabicName || stud.studName || "-"
        : stud.studName || stud.studArabicName || "-"}
      getItemSubtitle={(stud) => [stud.city, stud.country].filter(Boolean).join(" · ") || undefined}
      getItemImage={(stud) => stud.studProfileImage}
      onChange={onChange}
      disabled={disabled}
      pageSize={10}
      triggerClassName={triggerClassName}
    />
  );
}
