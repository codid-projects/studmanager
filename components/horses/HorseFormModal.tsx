'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslation } from '@/lib/locale-context';

interface HorseFormModalProps {
  isOpen: boolean;
  isManual?: boolean;
  initialData?: HorseFormData | null;
  onClose: () => void;
  onBack?: () => void;
  onSubmit: (data: HorseFormData) => void;
}

export interface HorseFormData {
  nameAr: string;
  nameEn: string;
  type: string;
  gender: string;
  birthDate: string;
  features?: number;
  description?: string;
  image?: File | string;
  imagePreview?: string;

  fatherNameAr?: string;
  fatherNameEn?: string;
  motherNameAr?: string;
  motherNameEn?: string;

  height?: string;
  color?: string;
  currentCountry?: string;
  birthCountry?: string;
  ownerName?: string;
  breederName?: string;
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
  breederPhoneNumber?: string;
  ownerPhoneNumber?: string;
  breederEmail?: string;
  ownerEmail?: string;

  video?: File | string;
  videoPreview?: string;
  videoLink?: string;
}

const emptyFormData: HorseFormData = {
  nameAr: '',
  nameEn: '',
  type: '',
  gender: '',
  birthDate: '',
  features: 0,
  description: '',
  fatherNameAr: '',
  fatherNameEn: '',
  motherNameAr: '',
  motherNameEn: '',
  height: '',
  color: '',
  currentCountry: '',
  birthCountry: '',
  ownerName: '',
  breederName: '',
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
  breederPhoneNumber: '',
  ownerPhoneNumber: '',
  breederEmail: '',
  ownerEmail: '',
  videoLink: '',
};

export const HorseFormModal: FC<HorseFormModalProps> = ({
  isOpen,
  isManual = true,
  initialData = null,
  onClose,
  onBack,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const { direction } = useLocale();
  const isRTL = direction === 'rtl';

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<HorseFormData>(emptyFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

      setImagePreview(typeof initialData.image === 'string' ? initialData.image : '');
      setVideoPreview(typeof initialData.video === 'string' ? initialData.video : '');
    } else {
      setFormData(emptyFormData);
      setImagePreview('');
      setVideoPreview('');
    }

    setImageFile(null);
    setVideoFile(null);
  }, [isOpen, initialData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelected = (file: File) => {
    const preview = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreview(preview);
  };

  const handleVideoSelected = (file: File) => {
    const preview = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoPreview(preview);
  };

  const handleFileDrop = (
    e: React.DragEvent<HTMLDivElement>,
    type: 'image' | 'video'
  ) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (type === 'image' && file.type.startsWith('image/')) {
      handleImageSelected(file);
    }

    if (type === 'video' && file.type.startsWith('video/')) {
      handleVideoSelected(file);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    onSubmit({
      ...formData,
      image: imageFile || formData.image,
      imagePreview,
      video: videoFile || formData.video,
      videoPreview,
    });

    handleClose();
  };

  const handleClose = () => {
    setFormData(emptyFormData);
    setImageFile(null);
    setImagePreview('');
    setVideoFile(null);
    setVideoPreview('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 md:p-4 lg:p-6">
      <div
        dir={direction}
        className="w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] overflow-hidden rounded-[20px] md:rounded-[28px] bg-white shadow-xl flex flex-col"
      >
        <div className="flex items-start justify-between px-4 md:px-8 lg:px-10 pb-3 md:pb-4 pt-4 md:pt-8 flex-row-reverse shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="text-[#5b5b5b] transition hover:text-black flex-shrink-0"
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

          <h2 className="text-[18px] md:text-[20px] lg:text-[22px] font-bold text-[#2F2740] mr-2 md:mr-0">
            {t('horses.manualAddTitle')}
          </h2>

          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 rounded-[14px] border border-[#eadfd9] bg-white px-4 py-2 text-sm font-semibold text-[#2b1a12] transition hover:bg-gray-50"
            >
              <svg
                className={`h-4 w-4 ${isRTL ? '' : 'rotate-180'}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{t('horses.backToStudbook')}</span>
            </button>
          ) : null}
        </div>

        <div className="px-4 md:px-8 lg:px-10 pb-4 md:pb-8 pt-2 flex-1 overflow-y-auto">
          {isManual && (
            <div className="mb-6 md:mb-10 overflow-x-auto">
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
                              : 'font-medium text-[#c7bdb7]'
                            }`}
                        >
                          {step.label}
                        </span>

                        <button
                          type="button"
                          onClick={() => setCurrentStep(step.id)}
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

                      <div className="mt-2 md:mt-3 h-[3px] md:h-[4px] w-full rounded-full bg-transparent">
                        {active && <div className="h-full w-full rounded-full bg-[#4a2b1a]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <p className="text-right text-sm font-semibold text-[#1a1108]">
                  {t('horses.image')}
                </p>

                <div className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#d5ccc6] bg-[#faf7f2] py-6 md:py-10 transition hover:bg-[#f5ede7] px-4">
                  <UploadCloudIcon />
                  <p className="text-sm font-medium text-[#3a2c24]">
                    {t('horses.dragDropImage')}
                  </p>
                </div>

                <div className={"grid grid-cols-1 gap-4 md:grid-cols-2"}>
                  <input
                    dir="rtl"
                    name="nameAr"
                    value={formData.nameAr}
                    onChange={handleInputChange}
                    placeholder={t('horses.horseNameAr')}
                    className={`rounded-xl border border-[#eadfd9] bg-white px-4 py-3 text-right text-sm focus:border-[#5a3b25] focus:outline-none focus:ring-2 focus:ring-[#5a3b25]/10 ${isRTL ? 'placeholder:text-right' : 'placeholder:text-left'}`}
                    required
                  />

                  <input
                    dir="ltr"
                    name="nameEn"
                    value={formData.nameEn}
                    onChange={handleInputChange}
                    placeholder={t('horses.horseNameEn')}
                    className={`rounded-xl border border-[#eadfd9] bg-white px-4 py-3 text-left text-sm focus:border-[#5a3b25] focus:outline-none focus:ring-2 focus:ring-[#5a3b25]/10 ${isRTL ? 'placeholder:text-right' : 'placeholder:text-left'}`}
                    required
                  />

                  <input
                    dir="rtl"
                    name="fatherNameAr"
                    value={formData.fatherNameAr}
                    onChange={handleInputChange}
                    placeholder={t('horses.horseFatherNameAr')}
                    className={`rounded-xl border border-[#eadfd9] bg-white px-4 py-3 text-right text-sm focus:border-[#5a3b25] focus:outline-none focus:ring-2 focus:ring-[#5a3b25]/10 ${isRTL ? 'placeholder:text-right' : 'placeholder:text-left'}`}
                  />

                  <input
                    dir="ltr"
                    name="fatherNameEn"
                    value={formData.fatherNameEn}
                    onChange={handleInputChange}
                    placeholder={t('horses.horseFatherNameEn')}
                    className={`rounded-xl border border-[#eadfd9] bg-white px-4 py-3 text-left text-sm focus:border-[#5a3b25] focus:outline-none focus:ring-2 focus:ring-[#5a3b25]/10 ${isRTL ? 'placeholder:text-right' : 'placeholder:text-left'}`}
                  />

                  <input
                    dir="rtl"
                    name="motherNameAr"
                    value={formData.motherNameAr}
                    onChange={handleInputChange}
                    placeholder={t('horses.horseMotherNameAr')}
                    className={`rounded-xl border border-[#eadfd9] bg-white px-4 py-3 text-right text-sm focus:border-[#5a3b25] focus:outline-none focus:ring-2 focus:ring-[#5a3b25]/10 ${isRTL ? 'placeholder:text-right' : 'placeholder:text-left'}`}
                  />

                  <input
                    dir="ltr"
                    name="motherNameEn"
                    value={formData.motherNameEn}
                    onChange={handleInputChange}
                    placeholder={t('horses.horseMotherNameEn')}
                    className={`rounded-xl border border-[#eadfd9] bg-white px-4 py-3 text-left text-sm focus:border-[#5a3b25] focus:outline-none focus:ring-2 focus:ring-[#5a3b25]/10 ${isRTL ? 'placeholder:text-right' : 'placeholder:text-left'}`}
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <select
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className="rounded-xl border border-[#eadfd9] bg-white px-4 py-2.5 text-right text-sm text-[#6a5a52]"
                    required
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <option value="" className={`${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('horses.birthDate')}
                    </option>
                  </select>

                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="rounded-xl border border-[#eadfd9] bg-white px-4 py-2.5 text-right text-sm text-[#6a5a52]"
                    required
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <option value="" className={`${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('horses.gender')}
                    </option>
                    <option value="male" className={`${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('horses.male')}
                    </option>
                    <option value="female" className={`${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('horses.female')}
                    </option>
                  </select>
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
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    dir="rtl"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    placeholder={t('horses.ownerName')}
                    className={`  rounded-xl border border-[#eadfd9] bg-white px-4 py-2.5 text-right text-sm focus:border-[#5a3b25] focus:outline-none focus:ring-2 focus:ring-[#5a3b25]/10 ${isRTL ? 'placeholder:text-right' : 'placeholder:text-left'}`}
                  />

                  <input
                    dir="rtl"
                    name="breederName"
                    value={formData.breederName}
                    onChange={handleInputChange}
                    placeholder={t('horses.breederName')}
                    className={`  rounded-xl border border-[#eadfd9] bg-white px-4 py-2.5 text-right text-sm focus:border-[#5a3b25] focus:outline-none focus:ring-2 focus:ring-[#5a3b25]/10 ${isRTL ? 'placeholder:text-right' : 'placeholder:text-left'}`}
                  />
                </div>

                <select
                  name="faceMarks"
                  value={formData.faceMarks}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-[#eadfd9] bg-white px-4 py-2.5 text-right text-sm text-[#6a5a52]"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <option value="" className={`${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('horses.faceMarks')}
                  </option>
                </select>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <select
                    name="frontLeftLeg"
                    value={formData.frontLeftLeg}
                    onChange={handleInputChange}
                    className="rounded-xl border border-[#eadfd9] bg-white px-4 py-2.5 text-right text-sm text-[#6a5a52]"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <option value="" className={`${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('horses.frontLeftLeg')}
                    </option>
                  </select>

                  <select
                    name="frontRightLeg"
                    value={formData.frontRightLeg}
                    onChange={handleInputChange}
                    className="rounded-xl border border-[#eadfd9] bg-white px-4 py-2.5 text-right text-sm text-[#6a5a52]"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <option value="" className={`${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('horses.frontRightLeg')}
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <select
                    name="backLeftLeg"
                    value={formData.backLeftLeg}
                    onChange={handleInputChange}
                    className="rounded-xl border border-[#eadfd9] bg-white px-4 py-2.5 text-right text-sm text-[#6a5a52]"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <option value="" className={`${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('horses.backLeftLeg')}
                    </option>
                  </select>

                  <select
                    name="backRightLeg"
                    value={formData.backRightLeg}
                    onChange={handleInputChange}
                    className="rounded-xl border border-[#eadfd9] bg-white px-4 py-2.5 text-right text-sm text-[#6a5a52]"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <option value="" className={`${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('horses.backRightLeg')}
                    </option>
                  </select>
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
                  <input
                    dir={isRTL ? 'rtl' : 'ltr'}
                    name="breederPhoneNumber"
                    value={formData.breederPhoneNumber ?? ''}
                    onChange={handleInputChange}
                    placeholder={t('horses.breederPhoneNumber')}
                    className="h-[50px] rounded-[18px] border border-[#bfb6b1] bg-white px-5 text-sm text-[#2b1a12] outline-none transition placeholder:text-[#6f625c] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10"
                  />
                  <input
                    dir={isRTL ? 'rtl' : 'ltr'}
                    name="breederEmail"
                    value={formData.breederEmail ?? ''}
                    onChange={handleInputChange}
                    placeholder={t('horses.breederEmail')}
                    className="h-[50px] rounded-[18px] border border-[#bfb6b1] bg-white px-5 text-sm text-[#2b1a12] outline-none transition placeholder:text-[#6f625c] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10"
                  />
                  <input
                    dir={isRTL ? 'rtl' : 'ltr'}
                    name="ownerPhoneNumber"
                    value={formData.ownerPhoneNumber ?? ''}
                    onChange={handleInputChange}
                    placeholder={t('horses.ownerPhoneNumber')}
                    className="h-[50px] rounded-[18px] border border-[#bfb6b1] bg-white px-5 text-sm text-[#2b1a12] outline-none transition placeholder:text-[#6f625c] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10"
                  />
                  <input
                    dir={isRTL ? 'rtl' : 'ltr'}
                    name="ownerEmail"
                    value={formData.ownerEmail ?? ''}
                    onChange={handleInputChange}
                    placeholder={t('horses.ownerEmail')}
                    className="h-[50px] rounded-[18px] border border-[#bfb6b1] bg-white px-5 text-sm text-[#2b1a12] outline-none transition placeholder:text-[#6f625c] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10"
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 md:space-y-10">
                <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleFileDrop(e, 'image')}
                    onClick={() => imageInputRef.current?.click()}
                    className="group flex min-h-[140px] md:min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[4px] bg-[#F8F7EE] px-4 md:px-6 py-6 md:py-8 text-center transition hover:bg-[#f3f1e5]"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Horse"
                        className="h-[100px] md:h-[140px] w-full rounded-xl object-cover"
                      />
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

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleFileDrop(e, 'video')}
                    onClick={() => videoInputRef.current?.click()}
                    className="group flex min-h-[140px] md:min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[4px] bg-[#F8F7EE] px-4 md:px-6 py-6 md:py-8 text-center transition hover:bg-[#f3f1e5]"
                  >
                    {videoFile ? (
                      <video
                        src={videoPreview}
                        controls
                        className="h-[100px] md:h-[140px] w-full rounded-xl object-cover"
                      />
                    ) : (
                      <>
                        <UploadCloudIcon />
                        <p className="mt-2 md:mt-4 text-sm md:text-[17px] font-bold text-[#2D2018]">
                          {t('horses.uploadVideo')}
                        </p>
                        <p className="mt-1 md:mt-2 text-xs md:text-sm text-[#8B8179]">
                          {t('horses.supportedVideos')}
                        </p>
                      </>
                    )}
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleVideoSelected(file);
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
                  className="h-[44px] md:h-[52px] w-full rounded-[18px] border border-[#bfb6b1] bg-white px-4 md:px-5 text-sm text-[#2b1a12] outline-none transition placeholder:text-[#5F554F] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10"
                />
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 pt-4 md:flex-row md:items-center md:justify-between md:pt-2 md:flex-row-reverse">
              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-[16px] border border-[#eadfd9] bg-white py-3 text-gray-700 transition hover:bg-gray-50 md:hidden"
              >
                {t('common.cancel')}
              </button>

              <div className="flex items-center flex-row-reverse justify-center gap-2 md:justify-start md:gap-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((p) => p - 1)}
                    className="flex flex-row-reverse items-center gap-2 rounded-[16px] border border-[#4A2B1A] bg-white px-4 md:px-6 py-3 font-semibold text-[#2b1a12] transition hover:bg-gray-50"
                  >
                    <svg
                      className={`h-4 w-4 md:h-5 md:w-5 ${isRTL ? '' : 'rotate-180'}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm md:text-base">{t('common.back')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === steps.length) {
                      handleSubmit();
                      return;
                    }
                    setCurrentStep((p) => p + 1);
                  }}
                  className="flex items-center gap-2 rounded-[16px] bg-[#4a2b1a] px-4 md:px-6 py-3 font-semibold text-white transition hover:opacity-90"
                >
                  <span className="text-sm md:text-base">{currentStep === steps.length ? t('common.save') : t('common.next')}</span>
                  {currentStep !== steps.length && (
                    <svg
                      className={`h-4 w-4 md:h-5 md:w-5 ${isRTL ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {currentStep === steps.length && (
                    <svg
                      className="h-4 w-4 md:h-5 md:w-5"
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
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="hidden rounded-[16px] border border-[#eadfd9] bg-white px-8 py-3 text-gray-700 transition hover:bg-gray-50 md:block"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
