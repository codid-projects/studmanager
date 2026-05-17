'use client';

import { FC, ReactNode } from 'react';
import { useLocale } from '@/lib/locale-context';

interface FormModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitText?: string;
  cancelText?: string;
  children: ReactNode;
  isLoading?: boolean;
}

export const FormModal: FC<FormModalProps> = ({
  isOpen,
  title,
  onClose,
  onSubmit,
  submitText = 'Save',
  cancelText = 'Cancel',
  children,
  isLoading = false,
}) => {
  const { direction } = useLocale();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b border-border-gray ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
          <h2 className="text-xl font-semibold text-text-dark">{title}</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-text-gray hover:text-text-dark transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={onSubmit} className={`p-6 space-y-6 ${direction === 'rtl' ? 'text-right' : ''}`}>
          {children}

          {/* Action Buttons */}
          <div className={`flex gap-3 pt-4 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary-dark text-primary-light py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '...' : submitText}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 border border-border-gray text-text-dark py-2 rounded-lg text-sm font-medium hover:bg-secondary-gray transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
