'use client';

import { useBodyScrollLock } from '@/components/common/useBodyScrollLock';
import { roleOptions, type MemberFormState } from './types';

interface TeamMemberModalProps {
  title: string;
  submitLabel: string;
  iconSrc: string;
  form: MemberFormState;
  onChange: (field: keyof MemberFormState, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function TeamMemberModal({
  title,
  submitLabel,
  iconSrc,
  form,
  onChange,
  onClose,
  onSubmit,
}: TeamMemberModalProps) {
  useBodyScrollLock(true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl rounded-[24px] bg-white px-8 py-6 shadow-2xl mx-4" dir="rtl">
        <div className="mb-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img src={iconSrc} alt="" className="h-8 w-8" />
            <h2 className="text-[2rem] font-bold text-[#27304a]">{title}</h2>
          </div>
          <button onClick={onClose} className="text-4xl leading-none text-[#555]" aria-label="Close">
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-8">
          <input
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="الاسم"
            className="h-12 rounded-[16px] border border-[#b9b8c4] px-5 text-right outline-none placeholder:text-[#c7c7cf]"
          />

          <select
            value={form.role}
            onChange={(e) => onChange('role', e.target.value)}
            className="h-12 rounded-[16px] border border-[#b9b8c4] px-5 text-right outline-none"
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <input
            value={form.username}
            onChange={(e) => onChange('username', e.target.value)}
            placeholder="اسم المستخدم"
            className="h-12 rounded-[16px] border border-[#b9b8c4] px-5 text-right outline-none placeholder:text-[#c7c7cf]"
          />

          <input
            value={form.password}
            onChange={(e) => onChange('password', e.target.value)}
            placeholder="كلمة السر"
            className="h-12 rounded-[16px] border border-[#b9b8c4] px-5 text-right outline-none placeholder:text-[#c7c7cf]"
          />
        </div>

        <div className="mt-7 flex justify-start gap-3">
          <button onClick={onSubmit} className="rounded-[14px] bg-[#442715] px-8 py-3 text-lg font-semibold text-white">
            {submitLabel}
          </button>
          <button onClick={onClose} className="rounded-[14px] border border-[#6d5444] px-8 py-3 text-lg font-semibold text-[#442715]">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
