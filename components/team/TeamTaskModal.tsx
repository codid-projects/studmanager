'use client';

import { useBodyScrollLock } from '@/components/common/useBodyScrollLock';
import { useLocale, useTranslation } from '@/lib/locale-context';
import type { TaskFormState, TaskStatus } from './types';

interface TeamTaskModalProps {
  form: TaskFormState;
  onChange: (field: keyof TaskFormState, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const taskStatuses: TaskStatus[] = ['inProgress', 'completed', 'delayed', 'awaitingApproval'];

export function TeamTaskModal({ form, onChange, onClose, onSubmit }: TeamTaskModalProps) {
  const { direction } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === 'rtl';

  useBodyScrollLock(true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl rounded-[24px] bg-white px-5 py-5 shadow-2xl sm:px-8 sm:py-6" dir={direction}>
        <div className="mb-7 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold text-[#27304a]">
            {isRTL ? 'إضافة مهمة' : 'Add Mission'}
          </h2>
          <button onClick={onClose} className="text-4xl leading-none text-[#555]" aria-label="Close">
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input
            value={form.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder={t('team.taskTitle')}
            className={`h-12 rounded-[16px] border border-[#b9b8c4] px-5 outline-none placeholder:text-[#c7c7cf] ${isRTL ? 'text-right' : 'text-left'}`}
          />

          <input
            value={form.assignee}
            onChange={(e) => onChange('assignee', e.target.value)}
            placeholder={t('team.taskAssignee')}
            className={`h-12 rounded-[16px] border border-[#b9b8c4] px-5 outline-none placeholder:text-[#c7c7cf] ${isRTL ? 'text-right' : 'text-left'}`}
          />

          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => onChange('dueDate', e.target.value)}
            className={`h-12 rounded-[16px] border border-[#b9b8c4] px-5 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
          />

          <select
            value={form.status}
            onChange={(e) => onChange('status', e.target.value)}
            className={`h-12 rounded-[16px] border border-[#b9b8c4] px-5 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
          >
            {taskStatuses.map((status) => (
              <option key={status} value={status}>
                {t(`team.taskStatuses.${status}`)}
              </option>
            ))}
          </select>

          <textarea
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder={t('team.taskDescription')}
            rows={4}
            className={`sm:col-span-2 rounded-[16px] border border-[#b9b8c4] px-5 py-3 outline-none placeholder:text-[#c7c7cf] ${isRTL ? 'text-right' : 'text-left'}`}
          />
        </div>

        <div className={`mt-7 flex gap-3 ${isRTL ? 'justify-start' : 'justify-end'}`}>
          <button onClick={onSubmit} className="rounded-[14px] bg-[#442715] px-8 py-3 text-lg font-semibold text-white">
            {t('common.save')}
          </button>
          <button onClick={onClose} className="rounded-[14px] border border-[#6d5444] px-8 py-3 text-lg font-semibold text-[#442715]">
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
