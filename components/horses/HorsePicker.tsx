"use client";

import { useCallback } from "react";
import { PaginatedPicker } from "@/components/common/PaginatedPicker";
import { clientApiFetch } from "@/lib/api/client";
import { localizeGender } from "@/lib/api/horse-formatters";
import type { HorseListItemDto, LocaleCode, PagedResponse } from "@/lib/api/types";
import { useLocale, useTranslation } from "@/lib/locale-context";

interface HorsePickerProps {
  value: number | null;
  selectedLabel?: string;
  onChange: (horse: HorseListItemDto) => void;
  disabled?: boolean;
  gender?: "Male" | "Female";
  placeholder?: string;
  title?: string;
  emptyText?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerClassName?: string;
}

export function HorsePicker({
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
}: HorsePickerProps) {
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
    return clientApiFetch<PagedResponse<HorseListItemDto>>({
      backendPath: "/api/Horses",
      nextPath: "/api/horses",
      backendQuery: { pageNumber, pageSize, search, gender },
      nextQuery: { pageNumber, pageSize, search, gender, locale },
      locale: localeCode,
    });
  }, [gender, locale, localeCode]);

  return (
    <PaginatedPicker
      value={value}
      selectedLabel={selectedLabel}
      placeholder={placeholder ?? t("picker.selectHorse")}
      title={title ?? placeholder ?? t("picker.selectHorse")}
      searchPlaceholder={t("picker.searchHorses")}
      emptyText={emptyText ?? t("picker.noHorsesFound")}
      fetchPage={fetchPage}
      getItemKey={(horse) => horse.localId ?? horse.id}
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
