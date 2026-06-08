'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/locale-context';

interface AssignBoxModalProps {
  open: boolean;
  horseId?: string;
  currentBox: string | null;
  onClose: () => void;
  onSubmit: (boxName: string) => Promise<void>;
}

export const AssignBoxModal = ({
  open,
  horseId,
  currentBox,
  onClose,
  onSubmit,
}: AssignBoxModalProps) => {
  const { direction, locale } = useLocale();
  const [boxName, setBoxName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRTL = direction === 'rtl';

  useEffect(() => {
    if (open) {
      setBoxName(currentBox || '');
      setError('');
    }
  }, [open, currentBox]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!horseId || !boxName.trim()) {
      setError(locale === 'ar' ? 'يرجى إدخال رقم الحظيرة' : 'Please enter a box number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(boxName.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === 'ar' ? 'فشل تعيين الحظيرة' : 'Failed to assign box'));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        dir={direction}
      >
        <h2 className="text-xl font-bold text-[#2f2118] mb-4">
          {locale === 'ar' ? 'تعيين حظيرة' : 'Assign Box'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#a08a6b] mb-2">
              {locale === 'ar' ? 'رقم الحظيرة' : 'Box Number'}
            </label>
            <input
              type="text"
              value={boxName}
              onChange={(e) => setBoxName(e.target.value)}
              placeholder={locale === 'ar' ? 'أدخل رقم الحظيرة' : 'Enter box number'}
              className={`w-full px-4 py-2 border border-[#e7d9cd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d2a1b] ${
                isRTL ? 'text-right' : 'text-left'
              }`}
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg border border-[#e7d9cd] text-[#3d2a1b] font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading || !boxName.trim()}
              className="flex-1 px-4 py-2 rounded-lg bg-[#3d2a1b] text-white font-medium hover:bg-[#2f2118] disabled:opacity-50 transition-colors"
            >
              {loading ? (locale === 'ar' ? 'جاري...' : 'Assigning...') : (locale === 'ar' ? 'تعيين' : 'Assign')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
