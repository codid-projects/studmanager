'use client';

import {
  Check,
  ChevronDown,
  CircleParking,
  Home,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocale } from '@/lib/locale-context';
import { clientApiFetch } from '@/lib/api/client';
import type {
  ApiResult,
  HousingMapDto,
  HousingUnitDto,
  LocaleCode,
  UpdateHousingUnitCapacityPayload,
} from '@/lib/api/types';
import { HousingMapPicker } from './HousingMapPicker';

interface AssignBoxModalProps {
  open: boolean;
  horseId?: string;
  currentBox: string | null;
  onClose: () => void;
  onSubmit: (boxName: string) => Promise<void>;
}

type AvailabilityFilter = 'all' | 'available' | 'occupied' | 'full';

const normalizeHousingCode = (code: string | null | undefined) => {
  const value = String(code ?? '');
  const slotIndex = value.toUpperCase().lastIndexOf('-P');
  return slotIndex > 0 ? value.slice(0, slotIndex) : value;
};

const getSelectedSlotNumber = (code: string | null | undefined) => {
  const value = String(code ?? '');
  const slotIndex = value.toUpperCase().lastIndexOf('-P');
  if (slotIndex < 0) return null;

  const slot = Number(value.slice(slotIndex + 2));
  return Number.isFinite(slot) ? slot : null;
};

export const AssignBoxModal = ({
  open,
  horseId,
  currentBox,
  onClose,
  onSubmit,
}: AssignBoxModalProps) => {
  const { direction, locale } = useLocale();
  const [selectedCode, setSelectedCode] = useState('');
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState<AvailabilityFilter>('all');
  const [mapData, setMapData] = useState<HousingMapDto | null>(null);
  const [loadingMap, setLoadingMap] = useState(false);
  const [capacitySavingCode, setCapacitySavingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isRTL = direction === 'rtl';

  useEffect(() => {
    if (!open) return;

    setSelectedCode(currentBox || '');
    setSearch('');
    setAvailability('all');
    setError('');
    setLoadingMap(true);

    clientApiFetch<ApiResult<HousingMapDto>>({
      backendPath: '/api/Housing/map',
      nextPath: '/api/housing/map',
      backendQuery: { mapKey: 'mousa' },
      nextQuery: { locale, mapKey: 'mousa' },
      locale: locale as LocaleCode,
    })
      .then((result) => {
        if (!result.data) throw new Error(result.message || 'Housing map unavailable');
        setMapData(result.data);
        if (currentBox && !result.data.units.some((unit) => unit.code === normalizeHousingCode(currentBox))) {
          setSelectedCode('');
        }
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : locale === 'ar'
              ? 'تعذر تحميل خريطة الإيواء'
              : 'Could not load the housing map',
        );
      })
      .finally(() => setLoadingMap(false));
  }, [open, currentBox, locale]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'contain';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
    };
  }, [open]);

  const units = mapData?.units ?? [];
  const selectedUnit = units.find((unit) => unit.code === normalizeHousingCode(selectedCode));
  const selectionChanged = Boolean(selectedCode) && selectedCode !== (currentBox || '');

  const filteredUnits = useMemo(() => {
    const term = search.trim().toLowerCase();

    return units.filter((unit) => {
      const belongsToCurrentHorse = unit.horses.some(
        (horse) => String(horse.id) === horseId,
      );
      const isFull = unit.horses.length >= unit.capacity && !belongsToCurrentHorse;
      const isOccupied = unit.horses.length > 0 && !isFull;

      if (availability === 'available' && (isFull || unit.horses.length > 0)) return false;
      if (availability === 'occupied' && !isOccupied) return false;
      if (availability === 'full' && !isFull) return false;

      if (!term) return true;

      return [
        unit.code,
        unit.nameEn,
        unit.nameAr,
        unit.groupEn,
        unit.groupAr,
        ...unit.horses.flatMap((horse) => [horse.englishName, horse.arabicName]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [availability, horseId, search, units]);

  const counts = useMemo(
    () =>
      units.reduce(
        (result, unit) => {
          const belongsToCurrentHorse = unit.horses.some(
            (horse) => String(horse.id) === horseId,
          );
          const full = unit.horses.length >= unit.capacity && !belongsToCurrentHorse;

          if (full) result.full += 1;
          else if (unit.horses.length > 0) result.occupied += 1;
          else result.available += 1;

          return result;
        },
        { available: 0, occupied: 0, full: 0 },
      ),
    [horseId, units],
  );

  const selectionIsFull =
    selectedUnit &&
    (selectedUnit.type === 'barn'
      ? (() => {
          const slotNumber = getSelectedSlotNumber(selectedCode);
          if (!slotNumber) return true;
          const slotHorse = selectedUnit.horses.find(
            (horse, index) => (horse.slotNumber ?? index + 1) === slotNumber,
          );

          return Boolean(slotHorse) && String(slotHorse?.id) !== horseId;
        })()
      : selectedUnit.horses.length >= selectedUnit.capacity &&
        !selectedUnit.horses.some((horse) => String(horse.id) === horseId));

  const selectUnit = (unit: HousingUnitDto) => {
    const belongsToCurrentHorse = unit.horses.some(
      (horse) => String(horse.id) === horseId,
    );
    const full = unit.horses.length >= unit.capacity && !belongsToCurrentHorse;
    if (full) return;

    setSelectedCode(unit.code);
    setError('');
  };

  const updateBarnCapacity = async (unit: HousingUnitDto, capacity: number) => {
    const nextCapacity = Math.max(unit.capacity, capacity);
    if (nextCapacity === unit.capacity || capacitySavingCode) return;

    const payload: UpdateHousingUnitCapacityPayload = {
      capacity: nextCapacity,
      mapKey: mapData?.mapKey ?? 'mousa',
      entityType: mapData?.entityType ?? null,
      entityId: mapData?.entityId ?? null,
    };

    setCapacitySavingCode(unit.code);
    setError('');

    try {
      const result = await clientApiFetch<ApiResult<HousingUnitDto>>({
        method: 'PATCH',
        backendPath: `/api/Housing/units/${encodeURIComponent(unit.code)}/capacity`,
        nextPath: `/api/housing/units/${encodeURIComponent(unit.code)}/capacity`,
        nextQuery: { locale },
        locale: locale as LocaleCode,
        body: payload,
      });

      if (result.succeeded === false || !result.data) {
        throw new Error(
          result.message ||
            (locale === 'ar'
              ? 'تعذر تحديث عدد أماكن العنبر'
              : 'Failed to update barn capacity'),
        );
      }

      setMapData((current) =>
        current
          ? {
              ...current,
              units: current.units.map((item) =>
                item.code === result.data?.code ? result.data : item,
              ),
            }
          : current,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : locale === 'ar'
            ? 'تعذر تحديث عدد أماكن العنبر'
            : 'Could not update barn places',
      );
    } finally {
      setCapacitySavingCode(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!horseId || !selectedCode) {
      setError(locale === 'ar' ? 'يرجى اختيار مكان الإيواء' : 'Please select a housing unit');
      return;
    }

    if (!selectionChanged) {
      setError(locale === 'ar' ? 'اختر مكاناً مختلفاً للحفظ' : 'Choose a different unit to save');
      return;
    }

    if (selectionIsFull) {
      setError(locale === 'ar' ? 'مكان الإيواء المحدد ممتلئ' : 'The selected housing unit is full');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(selectedCode);
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : locale === 'ar'
            ? 'فشل حفظ مكان الإيواء'
            : 'Failed to save housing',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const isEditing = Boolean(currentBox);

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center overscroll-contain p-2 sm:p-5">
      <div className="absolute inset-0 bg-[#1d130d]/60 backdrop-blur-[3px]" onClick={onClose} />

      <div
        className="relative z-10 flex max-h-[96vh] w-full max-w-[1480px] flex-col overflow-hidden rounded-[28px] bg-[#f8f5f1] shadow-2xl"
        dir={direction}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#e9ddd4] bg-white px-5 py-4 sm:px-7">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3ece5] text-[#4b2f1a]">
                <Home className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-[#2f2118] sm:text-2xl">
                  {isEditing
                    ? locale === 'ar'
                      ? 'تعديل مكان الإيواء'
                      : 'Edit Housing'
                    : locale === 'ar'
                      ? 'تعيين مكان إيواء'
                      : 'Assign Housing'}
                </h2>
                <p className="mt-0.5 text-sm text-[#857368]">
                  {locale === 'ar'
                    ? 'ابحث عن البوكس، راجع حالته، ثم احفظ اختيارك.'
                    : 'Search for a box, review its status, then save your selection.'}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f6f1ec] text-[#4b382d] hover:bg-[#ede4dc]"
            aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 lg:grid-cols-[370px_minmax(0,1fr)]">
            <aside className="flex min-h-[440px] flex-col border-b border-[#e9ddd4] bg-white lg:min-h-0 lg:border-b-0 lg:border-e">
              <div className="space-y-3 border-b border-[#eee5de] p-4 sm:p-5">
                <div className="relative">
                  <Search
                    className={`absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8d7c70] ${
                      isRTL ? 'right-4' : 'left-4'
                    }`}
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={
                      locale === 'ar'
                        ? 'ابحث بالكود، الاسم أو اسم الخيل'
                        : 'Search code, unit, or horse'
                    }
                    className={`h-12 w-full rounded-[14px] border border-[#e4d8cf] bg-[#fcfaf8] text-sm text-[#34251d] outline-none transition focus:border-[#6b4a34] focus:bg-white focus:ring-4 focus:ring-[#6b4a34]/10 ${
                      isRTL ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'
                    }`}
                    autoFocus
                  />
                  <ChevronDown
                    className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#9c8b80] ${
                      isRTL ? 'left-4' : 'right-4'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-4 gap-1 rounded-[13px] bg-[#f2ece7] p-1">
                  {([
                    ['all', locale === 'ar' ? 'الكل' : 'All'],
                    ['available', locale === 'ar' ? 'متاح' : 'Open'],
                    ['occupied', locale === 'ar' ? 'مشغول' : 'Used'],
                    ['full', locale === 'ar' ? 'ممتلئ' : 'Full'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAvailability(value)}
                      className={`rounded-[10px] px-2 py-2 text-xs font-bold transition ${
                        availability === value
                          ? 'bg-white text-[#4b2f1a] shadow-sm'
                          : 'text-[#89776c] hover:text-[#4b2f1a]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold text-[#8c7b70]">
                  <span>{filteredUnits.length} {locale === 'ar' ? 'مكان' : 'units'}</span>
                  <span>
                    <b className="text-[#4f8a5b]">{counts.available}</b> {locale === 'ar' ? 'متاح' : 'open'}
                    {' · '}
                    <b className="text-[#b15d3d]">{counts.occupied}</b> {locale === 'ar' ? 'مشغول' : 'used'}
                    {' · '}
                    <b className="text-[#b6433b]">{counts.full}</b> {locale === 'ar' ? 'ممتلئ' : 'full'}
                  </span>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3 sm:p-4">
                {loadingMap ? (
                  <div className="flex h-full min-h-44 items-center justify-center text-sm text-[#806e62]">
                    {locale === 'ar' ? 'جاري تحميل أماكن الإيواء...' : 'Loading housing units...'}
                  </div>
                ) : filteredUnits.length ? (
                  filteredUnits.map((unit) => (
                    <HousingOption
                      key={unit.code}
                      unit={unit}
                      locale={locale as 'ar' | 'en'}
                      selected={normalizeHousingCode(selectedCode) === unit.code}
                      current={normalizeHousingCode(currentBox) === unit.code}
                      currentHorseId={horseId}
                      onSelect={() => selectUnit(unit)}
                    />
                  ))
                ) : (
                  <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-[#ddd0c6] bg-[#fcfaf8] px-5 text-center">
                    <Search className="h-6 w-6 text-[#aa998d]" />
                    <p className="mt-2 text-sm font-semibold text-[#6f5c50]">
                      {locale === 'ar' ? 'لا توجد نتائج مطابقة' : 'No matching units'}
                    </p>
                  </div>
                )}
              </div>
            </aside>

            <main className="min-h-0 overflow-auto overscroll-contain p-3 sm:p-5">
              {loadingMap ? (
                <div className="flex min-h-[520px] items-center justify-center rounded-[22px] bg-white text-sm text-[#806e62]">
                  {locale === 'ar' ? 'جاري تحميل المخطط...' : 'Loading architectural plan...'}
                </div>
              ) : mapData ? (
                <HousingMapPicker
                  map={mapData}
                  locale={locale as 'ar' | 'en'}
                  selectedCode={selectedCode}
                  currentHorseId={horseId}
                  capacitySavingCode={capacitySavingCode}
                  onIncreaseCapacity={updateBarnCapacity}
                  onSelect={(code) => {
                    const unit = units.find((item) => item.code === normalizeHousingCode(code));
                    if (!unit) return;

                    if (unit.type === 'barn') {
                      const slotNumber = getSelectedSlotNumber(code);
                      const slotHorse = unit.horses.find(
                        (horse, index) => (horse.slotNumber ?? index + 1) === slotNumber,
                      );

                      if (!slotNumber || (slotHorse && String(slotHorse.id) !== horseId)) return;

                      setSelectedCode(code);
                      setError('');
                      return;
                    }

                    selectUnit(unit);
                  }}
                />
              ) : (
                <div className="flex min-h-[520px] items-center justify-center rounded-[22px] bg-white text-sm text-red-700">
                  {error}
                </div>
              )}
            </main>
          </div>

          <footer className="border-t border-[#e7dbd2] bg-white px-5 py-4 sm:px-7">
            {error && (
              <div className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                {selectedUnit ? (
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2ece6] text-[#4b2f1a]">
                      <CircleParking className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#34251d]">
                        {locale === 'ar' ? selectedUnit.nameAr : selectedUnit.nameEn}
                        <span className="mx-2 font-normal text-[#b3a49a]">|</span>
                        <span className="text-xs text-[#7c6a5f]">{selectedUnit.code}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-[#8c7a6f]">
                        {selectionChanged
                          ? locale === 'ar'
                            ? 'اختيار جديد جاهز للحفظ'
                            : 'New selection ready to save'
                          : locale === 'ar'
                            ? 'هذا هو مكان الإيواء الحالي'
                            : 'This is the current housing unit'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#89786d]">
                    {locale === 'ar' ? 'اختر بوكساً من القائمة أو المخطط.' : 'Select a box from the list or plan.'}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="min-w-28 rounded-[13px] border border-[#ded1c6] px-5 py-3 text-sm font-bold text-[#3d2a1b] hover:bg-[#faf6f2] disabled:opacity-50"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !selectedCode ||
                    !selectionChanged ||
                    Boolean(selectionIsFull)
                  }
                  className="flex min-w-40 items-center justify-center gap-2 rounded-[13px] bg-[#3d2a1b] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(61,42,27,0.18)] hover:bg-[#2f2118] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Check className="h-[18px] w-[18px]" />
                  {loading
                    ? locale === 'ar'
                      ? 'جاري الحفظ...'
                      : 'Saving...'
                    : isEditing
                      ? locale === 'ar'
                        ? 'حفظ التعديل'
                        : 'Save changes'
                      : locale === 'ar'
                        ? 'حفظ التعيين'
                        : 'Save assignment'}
                </button>
              </div>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};

function HousingOption({
  unit,
  locale,
  selected,
  current,
  currentHorseId,
  onSelect,
}: {
  unit: HousingUnitDto;
  locale: 'ar' | 'en';
  selected: boolean;
  current: boolean;
  currentHorseId?: string;
  onSelect: () => void;
}) {
  const belongsToCurrentHorse = unit.horses.some(
    (horse) => String(horse.id) === currentHorseId,
  );
  const full = unit.horses.length >= unit.capacity && !belongsToCurrentHorse;
  const occupied = unit.horses.length > 0;
  const horseNames = unit.horses
    .map(
      (horse) =>
        (locale === 'ar' ? horse.arabicName : horse.englishName) ||
        horse.englishName ||
        horse.arabicName,
    )
    .filter(Boolean)
    .join('، ');

  return (
    <button
      type="button"
      disabled={full}
      onClick={onSelect}
      className={`w-full rounded-[16px] border p-3.5 text-start transition ${
        selected
          ? 'border-[#4b2f1a] bg-[#4b2f1a] text-white shadow-[0_8px_20px_rgba(75,47,26,0.16)]'
          : full
            ? 'cursor-not-allowed border-[#efd8d4] bg-[#fff6f4] text-[#9d6d67]'
            : occupied
              ? 'border-[#e8c9ad] bg-[#fffaf4] text-[#423129] hover:border-[#c78e62]'
              : 'border-[#e7dcd4] bg-white text-[#423129] hover:border-[#8c6b53] hover:bg-[#fdf9f5]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">
              {locale === 'ar' ? unit.nameAr : unit.nameEn}
            </span>
            {current && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                selected ? 'bg-white/15 text-white' : 'bg-[#e9efe5] text-[#507047]'
              }`}>
                {locale === 'ar' ? 'الحالي' : 'Current'}
              </span>
            )}
          </div>
          <p className={`mt-1 text-[11px] ${selected ? 'text-white/70' : 'text-[#8c7a6f]'}`}>
            {unit.groupEn} · {unit.code}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
            selected
              ? 'bg-white/15 text-white'
              : full
                ? 'bg-[#f6d8d3] text-[#a83f37]'
                : occupied
                  ? 'bg-[#f6dfca] text-[#9a542e]'
                  : 'bg-[#e7f2e8] text-[#4f8057]'
          }`}
        >
          {full
            ? locale === 'ar'
              ? 'ممتلئ'
              : 'Full'
            : occupied
              ? locale === 'ar'
                ? 'مشغول'
                : 'Occupied'
              : locale === 'ar'
                ? 'متاح'
                : 'Available'}
        </span>
      </div>

      <div className={`mt-3 flex items-center justify-between gap-3 text-xs ${
        selected ? 'text-white/80' : 'text-[#78675c]'
      }`}>
        <span className="flex min-w-0 items-center gap-1.5">
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {horseNames || (locale === 'ar' ? 'لا يوجد خيل' : 'No horse assigned')}
          </span>
        </span>
        <span className="shrink-0 font-bold">
          {unit.horses.length}/{unit.capacity}
        </span>
      </div>
    </button>
  );
}
