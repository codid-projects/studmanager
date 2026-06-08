"use client";

import { useCallback } from "react";
import { PaginatedPicker } from "@/components/common/PaginatedPicker";
import { localizeGender } from "@/lib/api/horse-formatters";
import { normalizePagedList, searchExternalHorses } from "@/lib/api/external-horses";
import type { ExternalHorseSearchItem, LocaleCode } from "@/lib/api/types";
import { useLocale, useTranslation } from "@/lib/locale-context";

interface ExternalHorsePickerProps {
  value: number | null;
  selectedLabel?: string;
  onChange: (horse: ExternalHorseSearchItem) => void;
  disabled?: boolean;
  gender?: "Male" | "Female";
  placeholder?: string;
  title?: string;
  emptyText?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerClassName?: string;
}

export function ExternalHorsePicker({
  value,
  selectedLabel,
  onChange,
  disabled,
  gender,
  placeholder,
  title,
  emptyText,
  open,
  onOpenChange,
  triggerClassName,
}: ExternalHorsePickerProps) {
  const { locale } = useLocale();
  const { t } = useTranslation();
  const localeCode = locale as LocaleCode;

  const fetchPage = useCallback(async ({
    search,
    pageNumber,
    pageSize,
  }: {
    search?: string;
    pageNumber: number;
    pageSize: number;
  }) => {
    const result = await searchExternalHorses({
      searchTerm: search,
      gender,
      pageNumber,
      pageSize,
    });
    const page = normalizePagedList(result);

    return {
      data: page.items,
      currentPage: page.currentPage,
      hasNextPage: page.hasNextPage,
    };
  }, [gender]);

  return (
    <PaginatedPicker
      value={value}
      selectedLabel={selectedLabel}
      placeholder={placeholder ?? t("picker.selectHorse")}
      title={title ?? placeholder ?? t("picker.selectHorse")}
      searchPlaceholder={t("picker.searchHorses")}
      emptyText={emptyText ?? t("picker.noHorsesFound")}
      fetchPage={fetchPage}
      getItemKey={(horse) => horse.id}
      getItemLabel={(horse) => (
        locale === "ar"
          ? horse.arabicName || horse.englishName || "-"
          : horse.englishName || horse.arabicName || "-"
      )}
      getItemSubtitle={(horse) => horse.knownAs || localizeGender(horse.gender, localeCode) || undefined}
      getItemImage={(horse) => horse.horseProfileImage}
      onChange={onChange}
      disabled={disabled}
      open={open}
      onOpenChange={onOpenChange}
      triggerClassName={triggerClassName}
    />
  );
}
