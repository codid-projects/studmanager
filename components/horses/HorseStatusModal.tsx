'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, CircleCheck, Skull, X } from 'lucide-react';
import { useLocale } from '@/lib/locale-context';
import type { HorseDeceasedPayload } from '@/lib/api/types';

interface HorseStatusModalProps {
  open: boolean;
  horseName: string;
  isActive: boolean;
  deceasedAt?: string | null;
  deceasedReason?: string | null;
  saving: boolean;
  error?: string;
  onClose: () => void;
  onSave: (payload: HorseDeceasedPayload) => void;
}

function toDateInput(value?: string | null) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : date.toISOString().slice(0, 10);
}

export function HorseStatusModal({
  open,
  horseName,
  isActive,
  deceasedAt,
  deceasedReason,
  saving,
  error,
  onClose,
  onSave,
}: HorseStatusModalProps) {
  const { direction, t } = useLocale();
  const [date, setDate] = useState(toDateInput(deceasedAt));
  const [reason, setReason] = useState(deceasedReason ?? '');

  useEffect(() => {
    if (!open) return;
    setDate(toDateInput(deceasedAt));
    setReason(deceasedReason ?? '');
  }, [open, deceasedAt, deceasedReason]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, saving, onClose]);

  if (!open) return null;

  const submit = () => {
    if (isActive) {
      onSave({
        isDeceased: true,
        deceasedAt: date ? new Date(`${date}T12:00:00`).toISOString() : null,
        deceasedReason: reason.trim() || null,
      });
      return;
    }
    onSave({ isDeceased: false, deceasedAt: null, deceasedReason: null });
  };

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-[#211711]/55 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="horse-status-title"
        dir={direction}
        className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl"
      >
        <div className={`${isActive ? 'bg-gradient-to-br from-[#fff8f3] to-[#f8eee8]' : 'bg-gradient-to-br from-emerald-50 to-white'} px-6 pb-5 pt-6`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${isActive ? 'bg-[#8f3e36] text-white shadow-lg shadow-[#8f3e36]/20' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'}`}>
                {isActive ? <Skull className="h-7 w-7" /> : <CircleCheck className="h-7 w-7" />}
              </div>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#9a7f70]">{t('horses.horseStatus')}</p>
                <h2 id="horse-status-title" className="text-xl font-extrabold text-[#2b1a12]">
                  {isActive ? t('horses.markAsDeceased') : t('horses.restoreAsActive')}
                </h2>
                <p className="mt-1 text-sm font-medium text-[#765f52]">{horseName}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} disabled={saving} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#624e43] transition hover:bg-white disabled:opacity-50" aria-label={t('common.close')}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          <p className="text-sm leading-6 text-[#6f5d53]">
            {isActive ? t('horses.deceasedConfirmationHint') : t('horses.restoreActiveHint')}
          </p>

          {isActive ? (
            <>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#3b2a21]">{t('horses.deceasedDate')}</span>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-[#9b7c69] ltr:left-4 rtl:right-4" />
                  <input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setDate(event.target.value)} className="h-12 w-full rounded-xl border border-[#dfd1c7] bg-[#fdfbf9] px-4 ltr:pl-12 rtl:pr-12 text-[#38271e] outline-none transition focus:border-[#8f3e36] focus:ring-4 focus:ring-[#8f3e36]/10" />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#3b2a21]">{t('horses.deceasedReason')} <span className="font-normal text-[#9b887d]">({t('common.optional')})</span></span>
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={3} placeholder={t('horses.deceasedReasonPlaceholder')} className="w-full resize-none rounded-xl border border-[#dfd1c7] bg-[#fdfbf9] px-4 py-3 text-[#38271e] outline-none transition placeholder:text-[#ac9b92] focus:border-[#8f3e36] focus:ring-4 focus:ring-[#8f3e36]/10" />
              </label>
            </>
          ) : null}

          {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={saving} className="h-12 flex-1 rounded-xl border border-[#ddd0c7] bg-white font-bold text-[#604b3f] transition hover:bg-[#faf7f4] disabled:opacity-50">{t('common.cancel')}</button>
            <button type="button" onClick={submit} disabled={saving || (isActive && !date)} className={`h-12 flex-[1.35] rounded-xl font-bold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${isActive ? 'bg-[#8f3e36] shadow-[#8f3e36]/20 hover:bg-[#78332d]' : 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700'}`}>
              {saving ? t('common.loading') : isActive ? t('horses.confirmDeceased') : t('horses.confirmRestoreActive')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
