'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { FormModal } from '@/components/common/FormModal';
import { useLocale, useTranslation } from '@/lib/locale-context';
import { useState } from 'react';

interface Group {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  memberCount: number;
}

const mockGroups: Group[] = [
  {
    id: '1',
    nameAr: 'المجموعة الأولى',
    nameEn: 'First Group',
    description: 'وصف المجموعة',
    memberCount: 5,
  },
  {
    id: '2',
    nameAr: 'المجموعة الثانية',
    nameEn: 'Second Group',
    description: 'وصف المجموعة',
    memberCount: 8,
  },
];

export default function GroupsPage() {
  const { t } = useTranslation();
  const { direction, locale } = useLocale();
  const [groups, setGroups] = useState(mockGroups);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nameAr: '', nameEn: '', description: '' });

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nameAr && formData.nameEn) {
      const newGroup: Group = {
        id: Date.now().toString(),
        ...formData,
        memberCount: 0,
      };
      setGroups([...groups, newGroup]);
      setFormData({ nameAr: '', nameEn: '', description: '' });
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteGroup = (id: string) => {
    setSelectedGroupId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (selectedGroupId) {
      setGroups(groups.filter(g => g.id !== selectedGroupId));
      setIsDeleteConfirmOpen(false);
      setSelectedGroupId(null);
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className={`bg-primary-light border-b border-border-gray p-6 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
        <div className={`flex items-center justify-between gap-4 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
          <h1 className="text-2xl font-semibold text-text-dark">{t('groups.title')}</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary-dark text-primary-light px-6 py-2 rounded-full text-sm font-medium hover:bg-opacity-90 transition-all duration-300 flex items-center gap-2"
          >
            <span>+</span>
            <span>{t('groups.addNew')}</span>
          </button>
        </div>
      </div>

      {/* Content - Table View */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-gray bg-secondary-gray">
                <th className={`px-6 py-3 text-sm font-semibold text-text-dark ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                  {locale === 'ar' ? 'اسم المجموعة' : 'Group Name'}
                </th>
                <th className={`px-6 py-3 text-sm font-semibold text-text-dark ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                  {locale === 'ar' ? 'الوصف' : 'Description'}
                </th>
                <th className={`px-6 py-3 text-sm font-semibold text-text-dark ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                  {locale === 'ar' ? 'عدد الأعضاء' : 'Members'}
                </th>
                <th className={`px-6 py-3 text-sm font-semibold text-text-dark ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                  {locale === 'ar' ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id} className="border-b border-border-gray hover:bg-secondary-gray transition-colors">
                  <td className={`px-6 py-4 text-sm text-text-dark ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                    {locale === 'ar' ? group.nameAr : group.nameEn}
                  </td>
                  <td className={`px-6 py-4 text-sm text-text-gray ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                    {group.description}
                  </td>
                  <td className={`px-6 py-4 text-sm text-text-dark ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                    {group.memberCount}
                  </td>
                  <td className={`px-6 py-4 text-sm flex gap-3 ${direction === 'rtl' ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
                    <button className="text-text-gray hover:text-primary-dark transition-colors" title="Edit">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Group Modal */}
      <FormModal
        isOpen={isAddModalOpen}
        title={t('groups.addGroup')}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddGroup}
        submitText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <div className={`space-y-4 ${direction === 'rtl' ? 'text-right' : ''}`}>
          <input
            type="text"
            placeholder={t('groups.groupNameAr')}
            value={formData.nameAr}
            onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
            className={`w-full border border-border-gray rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
            required
          />
          <input
            type="text"
            placeholder={t('groups.groupNameEn')}
            value={formData.nameEn}
            onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
            className={`w-full border border-border-gray rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
            required
          />
          <textarea
            placeholder={t('groups.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className={`w-full border border-border-gray rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
          />
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsDeleteConfirmOpen(false);
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <div>
              <p className="text-lg font-semibold text-text-dark">{t('common.delete')}</p>
              <p className="text-sm text-text-gray mt-1">
                {locale === 'ar' ? 'هل أنت متأكد من حذف هذه المجموعة؟' : 'Are you sure you want to delete this group?'}
              </p>
            </div>
            <div className={`flex gap-3 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                {t('common.delete')}
              </button>
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 border border-border-gray text-text-dark py-2 rounded-lg text-sm font-medium hover:bg-secondary-gray transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
