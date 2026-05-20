'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslation } from '@/lib/locale-context';
import { COUNTRY_TRANSLATIONS, HORSE_COLOR_TRANSLATIONS } from '@/lib/api/localization';
import { getDefaultStud, normalizePagedList, searchExternalHorses, searchExternalStuds } from '@/lib/api/external-horses';
import { getLocalizedName } from '@/lib/api/localization';
import type { DefaultStudDto, ExternalHorseSearchItem, ExternalStudSearchItem } from '@/lib/api/types';

interface HorseFormModalProps {
  isOpen: boolean;
  isManual?: boolean;
  initialData?: HorseFormData | null;
  onClose: () => void;
  onBack?: () => void;
  onSubmit: (data: HorseFormData) => void | Promise<void>;
}

export interface HorseFormData {
  nameAr: string;
  nameEn: string;
  knownAs?: string;
  type: string;
  gender: string;
  birthDate: string;
  features?: number;
  description?: string;
  image?: File | string;
  imagePreview?: string;
  existingImages?: Array<{ id: number; url: string }>;
  newImages?: File[];
  removeImageIds?: number[];

  fatherNameAr?: string;
  fatherNameEn?: string;
  fatherStudbookId?: number;
  fatherPedigreeSummary?: string;
  motherNameAr?: string;
  motherNameEn?: string;
  motherStudbookId?: number;
  motherPedigreeSummary?: string;

  height?: string;
  color?: string;
  currentCountry?: string;
  birthCountry?: string;
  ownerName?: string;
  ownerStudbookId?: number;
  breederName?: string;
  breederStudbookId?: number;
  faceMarks?: string;
  frontLeftLeg?: string;
  frontRightLeg?: string;
  backLeftLeg?: string;
  backRightLeg?: string;
  notes?: string;

  registrationNumber?: string;
  microchipId?: string;
  feiRegistrationNumber?: string;
  nationalRegistrationNumber?: string;
  uelnNumber?: string;
  passportNumber?: string;

  videoLink?: string;
}

const emptyFormData: HorseFormData = {
  nameAr: '',
  nameEn: '',
  knownAs: '',
  type: '',
  gender: '',
  birthDate: '',
  features: 0,
  description: '',
  fatherNameAr: '',
  fatherNameEn: '',
  fatherStudbookId: undefined,
  fatherPedigreeSummary: '',
  motherNameAr: '',
  motherNameEn: '',
  motherStudbookId: undefined,
  motherPedigreeSummary: '',
  height: '',
  color: '',
  currentCountry: '',
  birthCountry: '',
  ownerName: '',
  ownerStudbookId: undefined,
  breederName: '',
  breederStudbookId: undefined,
  faceMarks: '',
  frontLeftLeg: '',
  frontRightLeg: '',
  backLeftLeg: '',
  backRightLeg: '',
  notes: '',
  registrationNumber: '',
  microchipId: '',
  feiRegistrationNumber: '',
  nationalRegistrationNumber: '',
  uelnNumber: '',
  passportNumber: '',
  videoLink: '',
  existingImages: [],
  newImages: [],
  removeImageIds: [],
};

type MarkingOption = {
  value: string;
  label: string;
  labelAr: string;
  image: string;
};

const FACE_MARKING_OPTIONS: MarkingOption[] = [
  { value: 'No Mark', label: 'No Mark', labelAr: 'بدون علامة', image: '/horse-options/f-no-mark.png' },
  { value: 'Star', label: 'Star', labelAr: 'نجمة', image: '/horse-options/f-star.png' },
  { value: 'Dashed', label: 'Dashed', labelAr: 'متقطع', image: '/horse-options/f-dashed.png' },
  { value: 'Snip', label: 'Snip', labelAr: 'لطخة الأنف', image: '/horse-options/f-snip.png' },
  { value: 'Irregular stripe', label: 'Irregular stripe', labelAr: 'خط غير منتظم', image: '/horse-options/f-irr-stripe.png' },
  { value: 'Continuous strip', label: 'Continuous strip', labelAr: 'خط متصل', image: '/horse-options/f-cont-strip.png' },
  { value: 'Blaze', label: 'Blaze', labelAr: 'غرة عريضة', image: '/horse-options/f-blaze.png' },
  { value: 'Bald face', label: 'Bald face', labelAr: 'وجه أبيض', image: '/horse-options/f-bald-face.png' },
];

const FRONT_LEG_OPTIONS: MarkingOption[] = [
  { value: 'No mark', label: 'No mark', labelAr: 'بدون علامة', image: '/horse-options/lf-no-mark.png' },
  { value: 'Ankel', label: 'Ankle', labelAr: 'الكاحل', image: '/horse-options/lf-ankel.png' },
  { value: 'Stocking', label: 'Stocking', labelAr: 'جورب طويل', image: '/horse-options/lf-stocking.png' },
  { value: 'Sock', label: 'Sock', labelAr: 'جورب', image: '/horse-options/lf-sock.png' },
  { value: 'Coronet', label: 'Coronet', labelAr: 'التاج', image: '/horse-options/lf-coronet.png' },
];

const BACK_LEG_OPTIONS: MarkingOption[] = [
  { value: 'No mark', label: 'No mark', labelAr: 'بدون علامة', image: '/horse-options/lb-no-mark.png' },
  { value: 'Ankel', label: 'Ankle', labelAr: 'الكاحل', image: '/horse-options/lb-ankel.png' },
  { value: 'Stocking', label: 'Stocking', labelAr: 'جورب طويل', image: '/horse-options/lb-stocking.png' },
  { value: 'Sock', label: 'Sock', labelAr: 'جورب', image: '/horse-options/lb-sock.png' },
  { value: 'Coronet', label: 'Coronet', labelAr: 'التاج', image: '/horse-options/lb-coronet.png' },
];

const ARABIC_ONLY_REGEX = /^[\u0600-\u06FF\s]+$/;
const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-[#b04444]">{message}</p>;
}

function MarkingPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: MarkingOption[];
  onChange: (value: string) => void;
}) {
  const { direction, locale } = useLocale();
  const isRTL = direction === 'rtl';
  const isArabic = locale === 'ar';
  const selected = options.find((option) => option.value === value);
  const [open, setOpen] = useState(false);
  const selectedLabel = selected ? (isArabic ? selected.labelAr : selected.label) : label;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-[58px] w-full items-center gap-3 rounded-xl border border-[#eadfd9] bg-white px-4 text-sm text-[#6a5a52] transition hover:bg-[#faf7f2] ${
          isRTL ? 'flex-row-reverse text-right' : 'text-left'
        }`}
      >
        {selected ? (
          <img src={selected.image} alt="" className="h-10 w-10 rounded-lg bg-[#f8f2ed] object-contain" />
        ) : (
          <span className="h-10 w-10 rounded-lg bg-[#f8f2ed]" />
        )}
        <span className="min-w-0 flex-1 truncate">
          {selectedLabel}
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div dir={direction} className="w-full max-w-3xl rounded-[24px] bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#2b1a12]">{label}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7f1eb] text-[#3b2b20]"
                aria-label={isArabic ? 'إغلاق' : 'Close'}
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`rounded-2xl border p-3 text-center transition hover:bg-[#faf7f2] ${
                    value === option.value ? 'border-[#4a2b1a] bg-[#f7eee7]' : 'border-[#eadfd9] bg-white'
                  }`}
                >
                  <img src={option.image} alt="" className="mx-auto h-24 w-full object-contain" />
                  <span className="mt-2 block text-xs font-semibold text-[#3b2b20]">
                    {isArabic ? option.labelAr : option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StudbookParentPicker({
  label,
  placeholder,
  gender,
  selectedId,
  selectedName,
  selectedDetails,
  onSelect,
}: {
  label: string;
  placeholder: string;
  gender?: 'Male' | 'Female';
  selectedId?: number;
  selectedName?: string;
  selectedDetails?: string;
  onSelect: (horse: ExternalHorseSearchItem) => void;
}) {
  const { direction, locale } = useLocale();
  const isRTL = direction === 'rtl';
  const isArabic = locale === 'ar';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ExternalHorseSearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const parentSummary = (horse: ExternalHorseSearchItem) => {
    const father = getLocalizedName(horse.horseFatherEnglishName, horse.horseFatherArabicName, isArabic);
    const mother = getLocalizedName(horse.horseMotherEnglishName, horse.horseMotherArabicName, isArabic);
    const hasFather = father && father !== '-';
    const hasMother = mother && mother !== '-';

    if (!hasFather && !hasMother) return '';

    return [
      hasFather ? `${isArabic ? 'الأب' : 'Father'}: ${father}` : null,
      hasMother ? `${isArabic ? 'الأم' : 'Mother'}: ${mother}` : null,
    ].filter(Boolean).join(' | ');
  };

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const result = await searchExternalHorses({
          searchTerm: query.trim() || undefined,
          gender,
          pageNumber,
          pageSize: 6,
        });
        const page = normalizePagedList(result);
        setResults(page.items);
        setTotalPages(page.totalPages);
        setTotalCount(page.totalCount);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : isArabic
              ? 'تعذر البحث في سجل الخيول'
              : 'Failed to search studbook',
        );
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [open, query, gender, pageNumber, isArabic]);

  return (
    <div className="rounded-2xl border border-[#eadfd9] bg-[#fffaf6] p-3">
      <label className="mb-2 block text-xs font-bold text-[#4a2b1a]">{label}</label>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setPageNumber(1);
        }}
        className={`h-11 w-full rounded-xl border border-[#d8cec8] bg-white px-3 text-sm font-semibold text-[#3b2b20] outline-none transition hover:bg-[#faf7f2] ${
          isRTL ? 'text-right' : 'text-left'
        }`}
      >
        {selectedName || placeholder}
      </button>
      {selectedId ? (
        <div className="mt-2 rounded-xl bg-[#f1e6dd] px-3 py-2 text-xs font-semibold text-[#3b2b20]">
          <div>{selectedName}</div>
          {selectedDetails ? (
            <div className="mt-1 font-medium text-[#7a6c63]">{selectedDetails}</div>
          ) : null}
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <div dir={direction} className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-[24px] bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#2b1a12]">{label}</h3>
                <p className="mt-1 text-xs text-[#7a6c63]">
                  {totalCount ? `${totalCount} ${isArabic ? 'نتيجة' : 'results'}` : placeholder}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="h-9 w-9 rounded-full bg-[#f7f1eb] text-xl text-[#3b2b20]">×</button>
            </div>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPageNumber(1);
              }}
              placeholder={placeholder}
              className={`mb-3 h-11 rounded-xl border border-[#d8cec8] bg-white px-3 text-sm outline-none focus:border-[#5a3b25] ${isRTL ? 'text-right' : 'text-left'}`}
            />
            {loading ? <div className="py-8 text-center text-sm text-[#7a6c63]">{isArabic ? 'جارٍ التحميل...' : 'Loading...'}</div> : null}
            {error ? <div className="mb-3 rounded-xl bg-[#fff3f3] px-3 py-2 text-xs text-[#b04444]">{error}</div> : null}
            {!loading ? (
              <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#eadfd9]">
                {results.length ? results.map((horse) => (
                  <button
                    key={horse.id}
                    type="button"
                    onClick={() => {
                      onSelect(horse);
                      setOpen(false);
                      setQuery('');
                      setResults([]);
                    }}
                    className={`block w-full border-b border-[#f1e8e1] px-3 py-3 text-sm font-semibold text-[#2f2740] transition last:border-b-0 hover:bg-[#faf7f2] ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    <span className="block">{getLocalizedName(horse.englishName, horse.arabicName, isArabic)}</span>
                    {parentSummary(horse) ? (
                      <span className="mt-1 block text-xs font-medium text-[#7a6c63]">{parentSummary(horse)}</span>
                    ) : null}
                  </button>
                )) : (
                  <div className="py-8 text-center text-sm text-[#7a6c63]">{isArabic ? 'لا توجد نتائج' : 'No results found'}</div>
                )}
              </div>
            ) : null}
            <div className="mt-3 flex items-center justify-between gap-3">
              <button type="button" disabled={pageNumber <= 1 || loading} onClick={() => setPageNumber((page) => Math.max(1, page - 1))} className="rounded-xl border border-[#eadfd9] px-4 py-2 text-sm font-semibold text-[#3b2b20] disabled:opacity-40">
                {isArabic ? 'السابق' : 'Previous'}
              </button>
              <span className="text-xs font-semibold text-[#7a6c63]">{pageNumber} / {Math.max(1, totalPages)}</span>
              <button type="button" disabled={pageNumber >= totalPages || loading} onClick={() => setPageNumber((page) => page + 1)} className="rounded-xl border border-[#eadfd9] px-4 py-2 text-sm font-semibold text-[#3b2b20] disabled:opacity-40">
                {isArabic ? 'التالي' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StudPicker({
  label,
  placeholder,
  selectedId,
  selectedName,
  defaultStudName,
  defaultStudLoading = false,
  onUseDefault,
  onSelect,
}: {
  label: string;
  placeholder: string;
  selectedId?: number;
  selectedName?: string;
  defaultStudName?: string;
  defaultStudLoading?: boolean;
  onUseDefault?: () => void;
  onSelect: (stud: ExternalStudSearchItem) => void;
}) {
  const { t } = useTranslation();
  const { direction, locale } = useLocale();
  const isRTL = direction === 'rtl';
  const isArabic = locale === 'ar';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ExternalStudSearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const result = await searchExternalStuds({
          searchTerm: query.trim() || undefined,
          pageNumber,
          pageSize: 6,
        });
        const page = normalizePagedList(result);
        setResults(page.items);
        setTotalPages(page.totalPages);
        setTotalCount(page.totalCount);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : isArabic
              ? 'تعذر البحث في المربط'
              : 'Failed to search studs',
        );
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [open, query, pageNumber, isArabic]);

  const studName = (stud: ExternalStudSearchItem) =>
    getLocalizedName(stud.studName, stud.studArabicName, isArabic);

  return (
    <div className="rounded-2xl border border-[#eadfd9] bg-[#fffaf6] p-3">
      <label className="mb-2 block text-xs font-bold text-[#4a2b1a]">{label}</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setPageNumber(1);
          }}
          className={`h-11 min-w-0 flex-1 rounded-xl border border-[#d8cec8] bg-white px-3 text-sm font-semibold text-[#3b2b20] outline-none transition hover:bg-[#faf7f2] ${
            isRTL ? 'text-right' : 'text-left'
          }`}
        >
          <span className="block truncate">{selectedName || placeholder}</span>
        </button>
        {onUseDefault ? (
          <button
            type="button"
            onClick={onUseDefault}
            disabled={defaultStudLoading || !defaultStudName}
            title={defaultStudName}
            className="h-11 shrink-0 rounded-xl border border-[#cdb8a7] bg-white px-3 text-xs font-bold text-[#4a2b1a] transition hover:bg-[#f7f0e8] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {defaultStudLoading ? t('common.loading') : t('horses.useDefault')}
          </button>
        ) : null}
      </div>
      {selectedId ? (
        <div className="mt-2 rounded-xl bg-[#f1e6dd] px-3 py-2 text-xs font-semibold text-[#3b2b20]">
          {selectedName}
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <div dir={direction} className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-[24px] bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#2b1a12]">{label}</h3>
                <p className="mt-1 text-xs text-[#7a6c63]">
                  {totalCount ? `${totalCount} ${isArabic ? 'نتيجة' : 'results'}` : placeholder}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="h-9 w-9 rounded-full bg-[#f7f1eb] text-xl text-[#3b2b20]">×</button>
            </div>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPageNumber(1);
              }}
              placeholder={placeholder}
              className={`mb-3 h-11 rounded-xl border border-[#d8cec8] bg-white px-3 text-sm outline-none focus:border-[#5a3b25] ${isRTL ? 'text-right' : 'text-left'}`}
            />
            {loading ? <div className="py-8 text-center text-sm text-[#7a6c63]">{isArabic ? 'جارٍ التحميل...' : 'Loading...'}</div> : null}
            {error ? <div className="mb-3 rounded-xl bg-[#fff3f3] px-3 py-2 text-xs text-[#b04444]">{error}</div> : null}
            {!loading ? (
              <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#eadfd9]">
                {results.length ? results.map((stud) => (
                  <button
                    key={stud.id}
                    type="button"
                    onClick={() => {
                      onSelect(stud);
                      setOpen(false);
                      setQuery('');
                      setResults([]);
                    }}
                    className={`block w-full border-b border-[#f1e8e1] px-3 py-3 text-sm font-semibold text-[#2f2740] transition last:border-b-0 hover:bg-[#faf7f2] ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    <span className="block">{studName(stud)}</span>
                    {stud.country ? (
                      <span className="mt-1 block text-xs font-medium text-[#7a6c63]">{stud.country}</span>
                    ) : null}
                  </button>
                )) : (
                  <div className="py-8 text-center text-sm text-[#7a6c63]">{isArabic ? 'لا توجد نتائج' : 'No results found'}</div>
                )}
              </div>
            ) : null}
            <div className="mt-3 flex items-center justify-between gap-3">
              <button type="button" disabled={pageNumber <= 1 || loading} onClick={() => setPageNumber((page) => Math.max(1, page - 1))} className="rounded-xl border border-[#eadfd9] px-4 py-2 text-sm font-semibold text-[#3b2b20] disabled:opacity-40">
                {isArabic ? 'السابق' : 'Previous'}
              </button>
              <span className="text-xs font-semibold text-[#7a6c63]">{pageNumber} / {Math.max(1, totalPages)}</span>
              <button type="button" disabled={pageNumber >= totalPages || loading} onClick={() => setPageNumber((page) => page + 1)} className="rounded-xl border border-[#eadfd9] px-4 py-2 text-sm font-semibold text-[#3b2b20] disabled:opacity-40">
                {isArabic ? 'التالي' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export const HorseFormModal: FC<HorseFormModalProps> = ({
  isOpen,
  isManual = true,
  initialData = null,
  onClose,
  onBack,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const { direction, locale } = useLocale();
  const isRTL = direction === 'rtl';
  const isArabic = locale === 'ar';

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<HorseFormData>(emptyFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [defaultStud, setDefaultStud] = useState<DefaultStudDto | null>(null);
  const [defaultStudLoading, setDefaultStudLoading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const birthDateInputRef = useRef<HTMLInputElement>(null);
  const objectImagePreviewRef = useRef<string | null>(null);
  const modalTitle = initialData ? t('horses.editHorse') : t('horses.addNew');
  const defaultStudName = defaultStud
    ? getLocalizedName(defaultStud.studName, defaultStud.studArabicName, isArabic)
    : '';
  const applyDefaultStud = (target: 'owner' | 'breeder') => {
    if (!defaultStud) return;

    setFormData((prev) => ({
      ...prev,
      ...(target === 'owner'
        ? { ownerStudbookId: defaultStud.id, ownerName: defaultStudName }
        : { breederStudbookId: defaultStud.id, breederName: defaultStudName }),
    }));
  };

  const steps = [
    { id: 1, label: t('horses.step1') || 'اسم الخيل' },
    { id: 2, label: t('horses.step2') || 'بيانات الخيل' },
    { id: 3, label: t('horses.step3') || 'بيانات التعريف' },
    { id: 4, label: t('horses.step4') || 'تحميل الصور و الفيديوهات' },
  ];

  useEffect(() => {
    if (!isOpen) return;

    setCurrentStep(1);

    if (initialData) {
      setFormData({
        ...emptyFormData,
        ...initialData,
      });

      setImagePreview(
        initialData.imagePreview ||
        (typeof initialData.image === 'string' ? initialData.image : '') ||
        initialData.existingImages?.[0]?.url ||
        '',
      );
    } else {
      setFormData(emptyFormData);
      setImagePreview('');
    }

    setImageFile(null);
    setSubmitError('');
    setFieldErrors({});
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setDefaultStudLoading(true);

    getDefaultStud()
      .then((result) => {
        if (!mounted) return;
        setDefaultStud(result.data ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setDefaultStud(null);
      })
      .finally(() => {
        if (mounted) setDefaultStudLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (objectImagePreviewRef.current) {
        URL.revokeObjectURL(objectImagePreviewRef.current);
      }
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const setFieldValue = (name: keyof HorseFormData, value: HorseFormData[keyof HorseFormData]) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleImageSelected = (file: File) => {
    if (objectImagePreviewRef.current) {
      URL.revokeObjectURL(objectImagePreviewRef.current);
    }

    const preview = URL.createObjectURL(file);
    objectImagePreviewRef.current = preview;
    setImageFile(file);
    setImagePreview(preview);
    setFormData((prev) => ({ ...prev, image: file, imagePreview: preview }));
  };

  const handleClearProfileImage = () => {
    if (objectImagePreviewRef.current) {
      URL.revokeObjectURL(objectImagePreviewRef.current);
      objectImagePreviewRef.current = null;
    }

    setImageFile(null);
    setImagePreview('');
    setFormData((prev) => ({ ...prev, image: undefined, imagePreview: '' }));
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleGalleryImagesSelected = (files: FileList | File[]) => {
    const nextFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (!nextFiles.length) return;

    setFormData((prev) => ({
      ...prev,
      newImages: [...(prev.newImages ?? []), ...nextFiles],
    }));
  };

  const handleRemoveExistingImage = (imageId: number) => {
    setFormData((prev) => ({
      ...prev,
      existingImages: (prev.existingImages ?? []).filter((image) => image.id !== imageId),
      removeImageIds: [...(prev.removeImageIds ?? []), imageId],
    }));
  };

  const handleRemoveNewImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      newImages: (prev.newImages ?? []).filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const openBirthDatePicker = () => {
    const input = birthDateInputRef.current;
    if (!input) return;

    input.focus();
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    }
  };

  const handleFileDrop = (
    e: React.DragEvent<HTMLDivElement>,
    type: 'image' | 'gallery'
  ) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files?.length) return;

    if (type === 'gallery') {
      handleGalleryImagesSelected(files);
      return;
    }

    const file = files[0];
    if (file.type.startsWith('image/')) {
      handleImageSelected(file);
    }
  };

  const colorOptions = Object.entries(HORSE_COLOR_TRANSLATIONS).map(([value, label]) => ({
    value,
    label: isRTL ? label.ar : label.en,
  }));
  const countryOptions = Object.entries(COUNTRY_TRANSLATIONS)
    .filter(([value]) => value !== 'uae')
    .map(([value, label]) => ({
      value: label.en.toUpperCase(),
      label: isRTL ? label.ar : label.en,
    }));
  const heightOptions = Array.from({ length: 101 }, (_, index) => 100 + index);

  const messages = {
    required: isRTL ? 'هذا الحقل مطلوب' : 'This field is required',
    arabicOnly: isRTL ? 'يرجى إدخال الاسم باللغة العربية فقط' : 'Please enter Arabic letters only',
    invalidEmail: isRTL ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email',
    invalidYoutube: isRTL ? 'يرجى إدخال رابط يوتيوب صحيح' : 'Please enter a valid YouTube link',
  };

  const selectedParentSummary = (horse: ExternalHorseSearchItem) => {
    const father = getLocalizedName(horse.horseFatherEnglishName, horse.horseFatherArabicName, isRTL);
    const mother = getLocalizedName(horse.horseMotherEnglishName, horse.horseMotherArabicName, isRTL);
    const hasFather = father && father !== '-';
    const hasMother = mother && mother !== '-';

    return [
      hasFather ? `${isRTL ? 'الأب' : 'Father'}: ${father}` : null,
      hasMother ? `${isRTL ? 'الأم' : 'Mother'}: ${mother}` : null,
    ].filter(Boolean).join(' | ');
  };

  const validateStep = (step: number) => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.nameAr.trim()) errors.nameAr = messages.required;
      else if (!ARABIC_ONLY_REGEX.test(formData.nameAr.trim())) errors.nameAr = messages.arabicOnly;
      if (!formData.nameEn.trim()) errors.nameEn = messages.required;
    }

    if (step === 2) {
      if (!formData.birthDate) errors.birthDate = messages.required;
      if (!formData.gender) errors.gender = messages.required;
    }

    if (step === 4) {
      if (formData.videoLink && !YOUTUBE_REGEX.test(formData.videoLink)) errors.videoLink = messages.invalidYoutube;
    }

    return errors;
  };

  const handleGoToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
      return;
    }

    const errors = validateStep(currentStep);
    setFieldErrors(errors);
    if (Object.keys(errors).length === 0) setCurrentStep(step);
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setCurrentStep((p) => Math.min(steps.length, p + 1));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitError('');
    const errors = {
      ...validateStep(1),
      ...validateStep(2),
      ...validateStep(3),
      ...validateStep(4),
    };

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstStepWithError = [1, 2, 3, 4].find((step) => Object.keys(validateStep(step)).length > 0);
      if (firstStepWithError) setCurrentStep(firstStepWithError);
      return;
    }

    setSubmitting(true);

    try {
      const nextImage = imageFile || formData.image;

      await onSubmit({
        ...formData,
        image: nextImage instanceof File ? nextImage : imagePreview ? nextImage : undefined,
        imagePreview,
      });

      handleClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(emptyFormData);
    setImageFile(null);
    setImagePreview('');
    setSubmitError('');
    setFieldErrors({});
    setSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  const UploadCloudIcon = () => (
    <svg width="48" height="48" viewBox="0 0 68 68" fill="none" className="md:w-[68px] md:h-[68px]">
      <path
        d="M44.502 48.1673C50.1329 48.1673 54.6686 43.6315 54.6686 38.0007C54.6686 32.9279 50.9881 28.7409 46.1659 27.9305C45.6033 20.5908 39.4744 14.834 32.0005 14.834C24.8857 14.834 18.989 20.0593 17.9385 26.8825C12.8667 27.4013 8.91699 31.6812 8.91699 36.8898C8.91699 42.4462 13.4704 46.9997 19.0268 46.9997H24.2087"
        stroke="#4B3123"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="34" cy="34" r="10.5" stroke="#4B3123" strokeWidth="2" fill="none" />
      <path
        d="M34 40V29"
        stroke="#4B3123"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M30 33L34 29L38 33"
        stroke="#4B3123"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 md:p-4 lg:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        dir={direction}
        className="w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] overflow-hidden rounded-[20px] md:rounded-[28px] bg-white shadow-xl flex flex-col"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 px-4 pb-3 pt-4 md:px-8 md:pb-4 md:pt-8 lg:px-10 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#f7f1eb] text-[#5b5b5b] transition hover:text-black ${
              isRTL ? 'col-start-3 justify-self-end' : 'col-start-1 justify-self-start'
            }`}
            aria-label="Close"
          >
            <svg className="h-6 w-6 md:h-7 md:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="col-start-2 row-start-1 min-w-0 self-center">
            <h2 className="truncate text-center text-xl font-bold text-[#2b1a12] md:text-2xl">
              {modalTitle}
            </h2>
          </div>

          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className={`row-start-1 inline-flex items-center gap-2 rounded-2xl border-2 border-[#311C11] bg-[#fff7f1] px-3 py-2.5 text-sm font-bold text-[#311C11] shadow-[0_8px_18px_rgba(49,28,17,0.12)] transition hover:bg-[#311C11] hover:text-white focus:outline-none focus:ring-4 focus:ring-[#311C11]/15 sm:px-4 ${
                isRTL
                  ? 'col-start-1 flex-row-reverse justify-self-start'
                  : 'col-start-3 flex-row justify-self-end'
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#311C11] text-base leading-none text-white">
                {isRTL ? '→' : '←'}
              </span>
              <span className="hidden sm:inline">{t('horses.backToStudbook')}</span>
            </button>
          ) : null}
        </div>

        {isManual && (
          <div className="shrink-0 border-y border-[#f1e8e1] bg-[#fbf8f4] px-4 py-3 shadow-sm md:px-8 lg:px-10">
            <div className="overflow-x-auto">
            <div className="flex min-w-max items-center justify-between gap-4 md:gap-8 px-2">
              {steps.map((step) => {
                const active = step.id === currentStep;
                const completed = step.id < currentStep;

                return (
                  <div key={step.id} className="flex min-w-[140px] md:min-w-[170px] flex-col items-center">
                    <div className="flex flex-row-reverse items-center gap-2 md:gap-3">
                      <span
                        className={`whitespace-nowrap text-xs md:text-sm transition ${active
                          ? 'font-semibold text-[#2b1a12]'
                          : completed
                            ? 'font-semibold text-[#2b1a12]'
                            : 'font-medium text-[#a99d96]'
                          }`}
                      >
                        {step.label}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleGoToStep(step.id)}
                        className={`flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-full border text-xs md:text-sm font-semibold transition ${active || completed
                          ? 'border-[#3f2416] bg-[#3f2416] text-white'
                          : 'border-[#d8cec8] bg-white text-[#b7aca6]'
                          }`}
                      >
                        {completed ? (
                          <svg
                            className="h-4 w-4 md:h-5 md:w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path
                              d="M5 13l4 4L19 7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          step.id
                        )}
                      </button>
                    </div>

                    <div className="mt-2 md:mt-3 h-[3px] md:h-[4px] w-full rounded-full bg-[#e7dcd5]">
                      {active && <div className="h-full w-full rounded-full bg-[#4a2b1a]" />}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        )}

        <div className="px-4 md:px-8 lg:px-10 pb-6 pt-5 flex-1 overflow-y-auto overscroll-contain">
          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <p className="text-right text-sm font-semibold text-[#1a1108]">
                  {t('horses.image')}
                </p>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleFileDrop(e, 'image')}
                  onClick={() => imageInputRef.current?.click()}
                  className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#d5ccc6] bg-[#faf7f2] px-4 py-6 transition hover:bg-[#f5ede7] md:py-10"
                >
                  {imagePreview ? (
                    <div className="relative h-[180px] w-full overflow-hidden rounded-xl md:h-[240px]">
                      <img
                        src={imagePreview}
                        alt="Horse"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                          {isRTL ? 'تغيير الصورة' : 'Change photo'}
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleClearProfileImage();
                          }}
                          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8a2c22] shadow-sm transition hover:bg-[#fff5f3]"
                        >
                          {isRTL ? 'إزالة' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloudIcon />
                      <p className="text-sm font-medium text-[#3a2c24]">
                        {t('horses.dragDropImage')}
                      </p>
                    </>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageSelected(file);
                    }}
                  />
                </div>

                <div className={"grid grid-cols-1 gap-4 md:grid-cols-2"}>
                  <div>
                    <input
                      dir="rtl"
                      name="nameAr"
                      value={formData.nameAr}
                      onChange={handleInputChange}
                      placeholder={t('horses.horseNameAr')}
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-right text-sm focus:border-[#5a3b25] focus:outline-none focus:ring-2 focus:ring-[#5a3b25]/10 ${fieldErrors.nameAr ? 'border-[#d36b6b]' : 'border-[#eadfd9]'} ${isRTL ? 'placeholder:text-right' : 'placeholder:text-left'}`}
                    />
                    <FieldError message={fieldErrors.nameAr} />
                  </div>

                  <div>
                    <input
                      dir="ltr"
                      name="nameEn"
                      value={formData.nameEn}
                      onChange={handleInputChange}
                      placeholder={t('horses.horseNameEn')}
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-left text-sm focus:border-[#5a3b25] focus:outline-none focus:ring-2 focus:ring-[#5a3b25]/10 ${fieldErrors.nameEn ? 'border-[#d36b6b]' : 'border-[#eadfd9]'} ${isRTL ? 'placeholder:text-right' : 'placeholder:text-left'}`}
                    />
                    <FieldError message={fieldErrors.nameEn} />
                  </div>

                </div>

                <input
                  dir={isRTL ? 'rtl' : 'ltr'}
                  name="knownAs"
                  value={formData.knownAs ?? ''}
                  onChange={handleInputChange}
                  placeholder={isRTL ? 'الاسم المعروف به' : 'Known as'}
                  className={`w-full rounded-xl border border-[#eadfd9] bg-white px-4 py-3 text-sm focus:border-[#5a3b25] focus:outline-none focus:ring-2 focus:ring-[#5a3b25]/10 ${
                    isRTL ? 'text-right placeholder:text-right' : 'text-left placeholder:text-left'
                  }`}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <StudbookParentPicker
                    label={isRTL ? 'اختيار الأب من Studbook' : 'Select father from studbook'}
                    placeholder={isRTL ? 'ابحث باسم الأب' : 'Search father name'}
                    gender="Male"
                    selectedId={formData.fatherStudbookId}
                    selectedName={formData.fatherStudbookId ? getLocalizedName(formData.fatherNameEn, formData.fatherNameAr, isRTL) : undefined}
                    selectedDetails={formData.fatherPedigreeSummary}
                    onSelect={(horse) => {
                      setFormData((prev) => ({
                        ...prev,
                        fatherStudbookId: horse.id,
                        fatherNameAr: horse.arabicName ?? prev.fatherNameAr,
                        fatherNameEn: horse.englishName ?? prev.fatherNameEn,
                        fatherPedigreeSummary: selectedParentSummary(horse),
                      }));
                    }}
                  />
                  <StudbookParentPicker
                    label={isRTL ? 'اختيار الأم من Studbook' : 'Select mother from studbook'}
                    placeholder={isRTL ? 'ابحث باسم الأم' : 'Search mother name'}
                    gender="Female"
                    selectedId={formData.motherStudbookId}
                    selectedName={formData.motherStudbookId ? getLocalizedName(formData.motherNameEn, formData.motherNameAr, isRTL) : undefined}
                    selectedDetails={formData.motherPedigreeSummary}
                    onSelect={(horse) => {
                      setFormData((prev) => ({
                        ...prev,
                        motherStudbookId: horse.id,
                        motherNameAr: horse.arabicName ?? prev.motherNameAr,
                        motherNameEn: horse.englishName ?? prev.motherNameEn,
                        motherPedigreeSummary: selectedParentSummary(horse),
                      }));
                    }}
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={openBirthDatePicker}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') openBirthDatePicker();
                    }}
                  >
                    <input
                      ref={birthDateInputRef}
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className={`w-full rounded-xl border bg-white px-4 py-2.5 text-right text-sm text-[#6a5a52] ${fieldErrors.birthDate ? 'border-[#d36b6b]' : 'border-[#eadfd9]'}`}
                      dir={isRTL ? "rtl" : "ltr"}
                    />
                    <FieldError message={fieldErrors.birthDate} />
                  </div>

                  <div>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className={`w-full rounded-xl border bg-white px-4 py-2.5 text-right text-sm text-[#6a5a52] ${fieldErrors.gender ? 'border-[#d36b6b]' : 'border-[#eadfd9]'}`}
                      dir={isRTL ? "rtl" : "ltr"}
                    >
                      <option value="" className={`${isRTL ? 'text-right' : 'text-left'}`}>
                        {t('horses.gender')}
                      </option>
                      <option value="Male" className={`${isRTL ? 'text-right' : 'text-left'}`}>
                        {t('horses.male')}
                      </option>
                      <option value="Female" className={`${isRTL ? 'text-right' : 'text-left'}`}>
                        {t('horses.female')}
                      </option>
                    </select>
                    <FieldError message={fieldErrors.gender} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <select
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    className="rounded-xl border border-[#eadfd9] bg-white px-4 py-2.5 text-right text-sm text-[#6a5a52]"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <option value="" className={`${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('horses.height')}
                    </option>
                    {heightOptions.map((height) => (
                      <option key={height} value={String(height)} className={`${isRTL ? 'text-right' : 'text-left'}`}>
                        {isRTL ? `${height} سم` : `${height} cm`}
                      </option>
                    ))}
                  </select>

                  <select
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="rounded-xl border border-[#eadfd9] bg-white px-4 py-2.5 text-right text-sm text-[#6a5a52]"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <option value="" className={`${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('horses.color')}
                    </option>
                    {colorOptions.map((option) => (
                      <option key={option.value} value={option.value} className={`${isRTL ? 'text-right' : 'text-left'}`}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <select
                    name="currentCountry"
                    value={formData.currentCountry}
                    onChange={handleInputChange}
                    className="rounded-xl border border-[#eadfd9] bg-white px-4 py-2.5 text-right text-sm text-[#6a5a52]"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <option value="" className={`${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('horses.currentCountry')}
                    </option>
                    {countryOptions.map((option) => (
                      <option key={option.value} value={option.value} className={`${isRTL ? 'text-right' : 'text-left'}`}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    name="birthCountry"
                    value={formData.birthCountry}
                    onChange={handleInputChange}
                    className="rounded-xl border border-[#eadfd9] bg-white px-4 py-2.5 text-right text-sm text-[#6a5a52]"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <option value="" className={`${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('horses.birthCountry')}
                    </option>
                    {countryOptions.map((option) => (
                      <option key={option.value} value={option.value} className={`${isRTL ? 'text-right' : 'text-left'}`}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <StudPicker
                    label={t('horses.ownerName')}
                    placeholder={isRTL ? 'ابحث باسم المالك' : 'Search owner stud'}
                    selectedId={formData.ownerStudbookId}
                    selectedName={formData.ownerName}
                    defaultStudName={defaultStudName}
                    defaultStudLoading={defaultStudLoading}
                    onUseDefault={() => applyDefaultStud('owner')}
                    onSelect={(stud) => {
                      setFormData((prev) => ({
                        ...prev,
                        ownerStudbookId: stud.id,
                        ownerName: getLocalizedName(stud.studName, stud.studArabicName, isRTL),
                      }));
                    }}
                  />

                  <StudPicker
                    label={t('horses.breederName')}
                    placeholder={isRTL ? 'ابحث باسم المربي' : 'Search breeder stud'}
                    selectedId={formData.breederStudbookId}
                    selectedName={formData.breederName}
                    defaultStudName={defaultStudName}
                    defaultStudLoading={defaultStudLoading}
                    onUseDefault={() => applyDefaultStud('breeder')}
                    onSelect={(stud) => {
                      setFormData((prev) => ({
                        ...prev,
                        breederStudbookId: stud.id,
                        breederName: getLocalizedName(stud.studName, stud.studArabicName, isRTL),
                      }));
                    }}
                  />
                </div>

                <MarkingPicker
                  label={t('horses.faceMarks')}
                  value={formData.faceMarks}
                  options={FACE_MARKING_OPTIONS}
                  onChange={(value) => setFieldValue('faceMarks', value)}
                />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <MarkingPicker
                    label={t('horses.frontLeftLeg')}
                    value={formData.frontLeftLeg}
                    options={FRONT_LEG_OPTIONS}
                    onChange={(value) => setFieldValue('frontLeftLeg', value)}
                  />

                  <MarkingPicker
                    label={t('horses.frontRightLeg')}
                    value={formData.frontRightLeg}
                    options={FRONT_LEG_OPTIONS}
                    onChange={(value) => setFieldValue('frontRightLeg', value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <MarkingPicker
                    label={t('horses.backLeftLeg')}
                    value={formData.backLeftLeg}
                    options={BACK_LEG_OPTIONS}
                    onChange={(value) => setFieldValue('backLeftLeg', value)}
                  />

                  <MarkingPicker
                    label={t('horses.backRightLeg')}
                    value={formData.backRightLeg}
                    options={BACK_LEG_OPTIONS}
                    onChange={(value) => setFieldValue('backRightLeg', value)}
                  />
                </div>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder={t('horses.notes')}
                  rows={3}
                  dir={isRTL ? "rtl" : "ltr"}
                  className={`  w-full rounded-xl border border-[#eadfd9] bg-white px-4 py-3 text-right text-sm focus:border-[#5a3b25] focus:outline-none focus:ring-2 focus:ring-[#5a3b25]/10 ${isRTL ? 'placeholder:text-right' : 'placeholder:text-left'}`}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    dir={isRTL ? 'rtl' : 'ltr'}
                    name="registrationNumber"
                    value={formData.registrationNumber ?? ''}
                    onChange={handleInputChange}
                    placeholder={t('horses.registrationNumber')}
                    className="h-[50px] rounded-[18px] border border-[#bfb6b1] bg-white px-5 text-sm text-[#2b1a12] outline-none transition placeholder:text-[#6f625c] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10"
                  />
                  <input
                    dir={isRTL ? 'rtl' : 'ltr'}
                    name="microchipId"
                    value={formData.microchipId ?? ''}
                    onChange={handleInputChange}
                    placeholder={t('horses.microchipId')}
                    className="h-[50px] rounded-[18px] border border-[#bfb6b1] bg-white px-5 text-sm text-[#2b1a12] outline-none transition placeholder:text-[#6f625c] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10"
                  />
                  <input
                    dir={isRTL ? 'rtl' : 'ltr'}
                    name="feiRegistrationNumber"
                    value={formData.feiRegistrationNumber ?? ''}
                    onChange={handleInputChange}
                    placeholder={t('horses.feiRegistrationNumber')}
                    className="h-[50px] rounded-[18px] border border-[#bfb6b1] bg-white px-5 text-sm text-[#2b1a12] outline-none transition placeholder:text-[#6f625c] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10"
                  />
                  <input
                    dir={isRTL ? 'rtl' : 'ltr'}
                    name="nationalRegistrationNumber"
                    value={formData.nationalRegistrationNumber ?? ''}
                    onChange={handleInputChange}
                    placeholder={t('horses.nationalRegistrationNumber')}
                    className="h-[50px] rounded-[18px] border border-[#bfb6b1] bg-white px-5 text-sm text-[#2b1a12] outline-none transition placeholder:text-[#6f625c] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10"
                  />
                  <input
                    dir={isRTL ? 'rtl' : 'ltr'}
                    name="uelnNumber"
                    value={formData.uelnNumber ?? ''}
                    onChange={handleInputChange}
                    placeholder={t('horses.uelnNumber')}
                    className="h-[50px] rounded-[18px] border border-[#bfb6b1] bg-white px-5 text-sm text-[#2b1a12] outline-none transition placeholder:text-[#6f625c] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10"
                  />
                  <input
                    dir={isRTL ? 'rtl' : 'ltr'}
                    name="passportNumber"
                    value={formData.passportNumber ?? ''}
                    onChange={handleInputChange}
                    placeholder={t('horses.passportNumber')}
                    className="h-[50px] rounded-[18px] border border-[#bfb6b1] bg-white px-5 text-sm text-[#2b1a12] outline-none transition placeholder:text-[#6f625c] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10"
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 md:space-y-10">
                <div className="grid grid-cols-1 gap-4 md:gap-6">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleFileDrop(e, 'image')}
                    onClick={() => imageInputRef.current?.click()}
                    className="group flex min-h-[140px] md:min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[4px] bg-[#F8F7EE] px-4 md:px-6 py-6 md:py-8 text-center transition hover:bg-[#f3f1e5]"
                  >
                    {imagePreview ? (
                      <div className="relative h-[120px] w-full md:h-[160px]">
                        <img
                          src={imagePreview}
                          alt="Horse"
                          className="h-full w-full rounded-xl object-cover"
                        />
                        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
                          <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                            {isRTL ? 'تغيير الصورة' : 'Change photo'}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleClearProfileImage();
                            }}
                            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8a2c22] shadow-sm transition hover:bg-[#fff5f3]"
                          >
                            {isRTL ? 'إزالة' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <UploadCloudIcon />
                        <p className="mt-2 md:mt-4 text-sm md:text-[17px] font-bold text-[#2D2018]">
                          {t('horses.dragDropImage')}
                        </p>
                        <p className="mt-1 md:mt-2 text-xs md:text-sm text-[#8B8179]">
                          {t('horses.supportedImages')}
                        </p>
                      </>
                    )}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageSelected(file);
                      }}
                    />
                  </div>
                </div>

                <input
                  dir={isRTL ? 'rtl' : 'ltr'}
                  name="videoLink"
                  value={formData.videoLink ?? ''}
                  onChange={handleInputChange}
                  placeholder={t('horses.addVideoLink')}
                  className={`h-[44px] md:h-[52px] w-full rounded-[18px] border bg-white px-4 md:px-5 text-sm text-[#2b1a12] outline-none transition placeholder:text-[#5F554F] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10 ${fieldErrors.videoLink ? 'border-[#d36b6b]' : 'border-[#bfb6b1]'}`}
                />
                <FieldError message={fieldErrors.videoLink} />

                <div className="space-y-3">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleFileDrop(e, 'gallery')}
                    onClick={() => galleryInputRef.current?.click()}
                    className="group flex min-h-[110px] cursor-pointer flex-col items-center justify-center rounded-[4px] border border-dashed border-[#d5ccc6] bg-[#F8F7EE] px-4 py-6 text-center transition hover:bg-[#f3f1e5]"
                  >
                    <UploadCloudIcon />
                    <p className="mt-2 text-sm font-bold text-[#2D2018]">
                      {isRTL ? 'إضافة صور إضافية' : 'Add additional images'}
                    </p>
                    <p className="mt-1 text-xs text-[#8B8179]">
                      {t('horses.supportedImages')}
                    </p>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleGalleryImagesSelected(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {(formData.existingImages?.length || formData.newImages?.length) ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {(formData.existingImages ?? []).map((image) => (
                        <div key={image.id} className="relative overflow-hidden rounded-xl border border-[#eadfd9] bg-white">
                          <img src={image.url} alt="" className="h-24 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(image.id)}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#b04444] shadow"
                            aria-label={isRTL ? 'حذف الصورة' : 'Remove image'}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {(formData.newImages ?? []).map((file, index) => (
                        <div key={`${file.name}-${index}`} className="relative overflow-hidden rounded-xl border border-[#eadfd9] bg-white">
                          <img src={URL.createObjectURL(file)} alt="" className="h-24 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(index)}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#b04444] shadow"
                            aria-label={isRTL ? 'حذف الصورة' : 'Remove image'}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

          </form>
        </div>

        <div className="shrink-0 border-t border-[#eadfd9] bg-white/95 px-4 py-4 shadow-[0_-14px_30px_rgba(49,28,17,0.08)] backdrop-blur md:px-8 lg:px-10">
          {submitError ? (
            <div className="mb-3 rounded-xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444]">
              {submitError}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              onClick={handleClose}
              className="h-12 w-full rounded-2xl border border-[#eadfd9] bg-white px-6 text-sm font-semibold text-[#5f554f] transition hover:bg-[#fbf8f4] md:w-auto md:min-w-[120px]"
            >
              {t('common.cancel')}
            </button>

            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse justify-start' : 'justify-end'}`}>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((p) => p - 1)}
                  className={`inline-flex h-12 min-w-[112px] items-center justify-center gap-2 rounded-2xl border-2 border-[#4A2B1A] bg-white px-5 text-sm font-semibold text-[#2b1a12] transition hover:bg-[#fbf8f4] ${
                    isRTL ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <span className="text-lg leading-none">{isRTL ? '→' : '←'}</span>
                  <span>{t('common.back')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (currentStep === steps.length) {
                    handleSubmit();
                    return;
                  }
                  handleNext();
                }}
                disabled={submitting}
                className={`inline-flex h-12 min-w-[132px] items-center justify-center gap-2 rounded-2xl bg-[#4a2b1a] px-6 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(74,43,26,0.2)] transition hover:bg-[#321d12] disabled:cursor-not-allowed disabled:opacity-60 ${
                  isRTL ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <span>{submitting ? t('common.loading') : currentStep === steps.length ? t('common.save') : t('common.next')}</span>
                {currentStep === steps.length ? (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M5 20h14a1 1 0 0 0 1-1V8.5L15.5 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 20v-6h8v6M8 4v5h6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span className="text-lg leading-none">{isRTL ? '←' : '→'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
