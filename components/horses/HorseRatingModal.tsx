'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Star, X } from 'lucide-react';
import type { HorseRatingPayload, HorseRatingResponse } from '@/lib/api/types';
import { useLocale, useTranslation } from '@/lib/locale-context';

const scoreOptions = Array.from({ length: 17 }, (_, index) => 12 + index * 0.5);

const groups = [
  {
    key: 'arabian',
    en: 'Arabian Type',
    ar: 'الهوية والنمط العربي الأصيل',
    fields: [
      ['balance', 'Balance', 'التناسق والتوازن'],
      ['quality', 'Quality', 'الجودة والأصالة'],
      ['presence', 'Presence', 'الحضور والكاريزما'],
      ['tailCarriage', 'Tail Carriage', 'شيل الذيل والزهو'],
    ],
  },
  {
    key: 'head',
    en: 'Head & Neck',
    ar: 'الرأس والرقبة',
    fields: [
      ['headMuzzle', 'Head & Muzzle', 'تفاصيل الرأس والمنخرين'],
      ['neckMitbah', 'Neck & Mitbah', 'الرقبة والمذبح'],
    ],
  },
  {
    key: 'body',
    en: 'Body & Topline',
    ar: 'الجسم والخط العلوي',
    fields: [
      ['shoulderChest', 'Shoulder & Chest', 'الكتف والصدر'],
      ['toplineCroup', 'Topline & Croup', 'الخط العلوي والكفل'],
    ],
  },
  {
    key: 'limbs',
    en: 'Hooves & Limbs',
    ar: 'القوائم والحوافر',
    fields: [
      ['forelimbs', 'Forelimbs', 'القوائم الأمامية'],
      ['hindlimbsHooves', 'Hindlimbs & Hooves', 'القوائم الخلفية والحوافر'],
    ],
  },
  {
    key: 'movement',
    en: 'Athletic Ability & Movement',
    ar: 'الحركة والقدرة البدنية',
    fields: [
      ['trotImpulsion', 'Trot & Impulsion', 'الهرولة والاندفاع'],
      ['walkRhythm', 'Walk & Rhythm', 'المشي والتعليق الإيقاعي'],
    ],
  },
] as const;

const emptyRating: HorseRatingPayload = {
  balance: 16, quality: 16, presence: 16, tailCarriage: 16,
  headMuzzle: 16, neckMitbah: 16, shoulderChest: 16, toplineCroup: 16,
  forelimbs: 16, hindlimbsHooves: 16, trotImpulsion: 16, walkRhythm: 16,
  notes: '',
};

type ScoreKey = Exclude<keyof HorseRatingPayload, 'notes'>;

interface HorseRatingModalProps {
  open: boolean;
  horseName: string;
  rating: HorseRatingResponse | null;
  saving: boolean;
  error?: string;
  onClose: () => void;
  onSave: (payload: HorseRatingPayload) => Promise<void>;
}

export function HorseRatingModal({
  open, horseName, rating, saving, error, onClose, onSave,
}: HorseRatingModalProps) {
  const { direction } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === 'rtl';
  const [form, setForm] = useState<HorseRatingPayload>(emptyRating);

  useEffect(() => {
    if (!open) return;
    setForm(rating?.myRating ? { ...rating.myRating } : emptyRating);
  }, [open, rating]);

  const categoryScores = useMemo(() => groups.map((group) => {
    const values = group.fields.map(([key]) => Number(form[key]));
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }), [form]);
  const total = categoryScores.reduce((sum, score) => sum + score, 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[#1a120d]/70 p-2 sm:p-5" onClick={onClose}>
      <div
        dir={direction}
        className="max-h-[96vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-[#fbf9f4] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 bg-[#1c3b2b] px-5 py-5 text-white sm:px-7">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xl font-bold sm:text-2xl">
              <Star className="h-6 w-6 fill-[#d8b56a] text-[#d8b56a]" />
              {t('horses.ratingTitle')}
            </div>
            <p className="text-sm text-white/75">{horseName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/10 p-2 hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(96vh-92px)] overflow-y-auto p-4 sm:p-6">
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#d9c7aa] bg-white p-4">
              <span className="block text-xs font-semibold text-[#806e5c]">{t('horses.yourScore')}</span>
              <strong className="text-3xl text-[#1c3b2b]">{total.toFixed(1)} <small className="text-sm">/ 100</small></strong>
            </div>
            <div className="rounded-2xl border border-[#d9c7aa] bg-white p-4">
              <span className="block text-xs font-semibold text-[#806e5c]">{t('horses.averageRating')}</span>
              <strong className="text-3xl text-[#8a5b20]">{rating?.averageScore?.toFixed(1) ?? '-'} <small className="text-sm">/ 100</small></strong>
            </div>
            <div className="rounded-2xl border border-[#d9c7aa] bg-white p-4">
              <span className="block text-xs font-semibold text-[#806e5c]">{t('horses.ratingsCount')}</span>
              <strong className="text-3xl text-[#3b2b20]">{rating?.ratingsCount ?? 0}</strong>
            </div>
          </div>

          <div className="space-y-4">
            {groups.map((group, groupIndex) => (
              <section key={group.key} className="overflow-hidden rounded-2xl border border-[#ddd0bd] bg-white">
                <header className="flex items-center justify-between gap-3 bg-[#f1eadf] px-4 py-3">
                  <h3 className="font-bold text-[#1c3b2b]">{groupIndex + 1}. {isRTL ? group.ar : group.en}</h3>
                  <span className="rounded-full bg-[#1c3b2b] px-3 py-1 text-xs font-bold text-white">
                    {categoryScores[groupIndex].toFixed(1)} / 20
                  </span>
                </header>
                <div className="divide-y divide-[#eee6db]">
                  {group.fields.map(([key, en, ar]) => (
                    <div key={key} className="grid gap-3 px-4 py-4 md:grid-cols-[190px_1fr] md:items-center">
                      <label className="font-semibold text-[#3b2b20]">{isRTL ? ar : en}</label>
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {scoreOptions.map((score) => {
                          const selected = form[key] === score;
                          return (
                            <button
                              key={score}
                              type="button"
                              onClick={() => setForm((current) => ({ ...current, [key]: score }))}
                              className={`min-w-[44px] rounded-lg border px-2 py-2 text-xs font-bold transition ${
                                selected
                                  ? 'border-[#1c3b2b] bg-[#1c3b2b] text-white shadow-sm'
                                  : score >= 18
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                    : score >= 16
                                      ? 'border-lime-200 bg-lime-50 text-lime-800 hover:bg-lime-100'
                                      : score >= 14
                                        ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                        : 'border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100'
                              }`}
                            >
                              {score}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block font-semibold text-[#3b2b20]">{t('horses.ratingNotes')}</span>
            <textarea
              value={form.notes ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              maxLength={1000}
              rows={3}
              className="w-full rounded-2xl border border-[#d9c7aa] bg-white px-4 py-3 outline-none focus:border-[#1c3b2b] focus:ring-2 focus:ring-[#1c3b2b]/10"
            />
          </label>

          {error ? <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <div className={`mt-5 flex flex-wrap gap-3 ${isRTL ? 'justify-start' : 'justify-end'}`}>
            <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-[#cdbda9] bg-white px-6 py-3 font-semibold text-[#3b2b20]">
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={() => onSave(form)}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#1c3b2b] px-7 py-3 font-semibold text-white disabled:opacity-60"
            >
              <Check className="h-5 w-5" />
              {saving ? t('common.loading') : t('horses.saveRating')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
