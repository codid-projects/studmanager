'use client';

import { useState } from 'react';
import { Dna, HeartHandshake, Search } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ExternalHorsePicker } from '@/components/horses/ExternalHorsePicker';
import { HorsePicker } from '@/components/horses/HorsePicker';
import { HorsePedigreeTree } from '@/components/horses/HorsePedigreeTree';
import { getTestMatingTree } from '@/lib/api/external-horses';
import { getLocalizedName } from '@/lib/api/localization';
import type {
  ExternalHorseSearchItem,
  ExternalTreeNode,
  HorseListItemDto,
} from '@/lib/api/types';
import { useLocale, useTranslation } from '@/lib/locale-context';

type SelectedHorse = {
  localId?: number | null;
  studbookId?: number | null;
  name: string;
  tags?: Array<{ id: number; name: string }> | null;
};

export default function DatabasePage() {
  const { direction } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === 'rtl';
  const [activeTab, setActiveTab] = useState<'pedigree' | 'mating'>('pedigree');
  const [pedigreePickerOpen, setPedigreePickerOpen] = useState(false);
  const [pedigreeHorse, setPedigreeHorse] = useState<SelectedHorse | null>(null);
  const [father, setFather] = useState<SelectedHorse | null>(null);
  const [mother, setMother] = useState<SelectedHorse | null>(null);
  const [matingTree, setMatingTree] = useState<ExternalTreeNode[][] | null>(null);
  const [matingLoading, setMatingLoading] = useState(false);
  const [matingMessage, setMatingMessage] = useState('');

  const toSelectedHorse = (horse: ExternalHorseSearchItem): SelectedHorse => ({
    studbookId: horse.id,
    name: getLocalizedName(horse.englishName, horse.arabicName, isRTL),
  });
  const toSelectedLocalHorse = (horse: HorseListItemDto): SelectedHorse => ({
    localId: horse.localId ?? horse.id,
    studbookId: (horse as HorseListItemDto & { studbookId?: number | null }).studbookId ?? null,
    name: getLocalizedName(horse.englishName, horse.arabicName, isRTL),
    tags: horse.tags ?? [],
  });

  const selectParent = (
    horse: ExternalHorseSearchItem,
    setter: (selected: SelectedHorse) => void,
  ) => {
    setter(toSelectedHorse(horse));
    setMatingTree(null);
    setMatingMessage('');
  };

  const runMatingTest = async () => {
    if (!father || !mother) {
      setMatingMessage(t('database.selectBothParents'));
      return;
    }

    setMatingLoading(true);
    setMatingMessage('');
    setMatingTree(null);

    try {
      const result = await getTestMatingTree({
        horseFatherStudbookId: father.studbookId as number,
        horseMotherStudbookId: mother.studbookId as number,
        levels: 6,
      });
      setMatingTree(result.data ?? []);
    } catch {
      setMatingMessage(t('database.resultUnavailable'));
    } finally {
      setMatingLoading(false);
    }
  };

  const showMatingTree = matingLoading || matingTree !== null;

  return (
    <MainLayout>
      <div className={`space-y-6 ${isRTL ? 'font-cairo' : ''}`} dir={direction}>
        <div className="flex justify-end pt-4">
          <div className="inline-flex rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('pedigree')}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                activeTab === 'pedigree'
                  ? 'bg-[#3b2b20] text-white shadow-md'
                  : 'text-[#5a473d] hover:bg-gray-50'
              }`}
            >
              <Dna className="h-5 w-5" />
              {t('database.pedigreeTab')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mating')}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                activeTab === 'mating'
                  ? 'bg-[#3b2b20] text-white shadow-md'
                  : 'text-[#5a473d] hover:bg-gray-50'
              }`}
            >
              <HeartHandshake className="h-5 w-5" />
              {t('database.matingTab')}
            </button>
          </div>
        </div>

        <section className="rounded-[32px] border border-gray-100 bg-white p-5 shadow-[0_12px_26px_rgba(91,53,24,0.06)] sm:p-8">
          <div className="mb-7 space-y-2 text-sm font-medium text-[#8d7769] md:text-base">
            <p className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8d7769]" />
              {activeTab === 'pedigree'
                ? t('database.pedigreeNote')
                : t('database.matingNoteHeader')}
            </p>
            {activeTab === 'mating' && (
              <p className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8d7769]" />
                {t('database.matingNoteSub')}
              </p>
            )}
          </div>

          {activeTab === 'pedigree' ? (
            <div className="space-y-8">
              <div className="rounded-[24px] border border-[#eadfd6] bg-gradient-to-b from-[#fffdfb] to-[#faf6f1] p-4 shadow-[0_8px_24px_rgba(91,53,24,0.05)] sm:p-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#3b2b20] text-white shadow-sm">
                    <Search className="h-5 w-5" />
                  </span>
                  <div>
                    <label className="block text-sm font-bold text-[#3b2b20]">
                      {t('database.selectHorse')}
                    </label>
                    <p className="mt-0.5 text-xs font-medium text-[#8d7769]">
                      {t('database.selectHorseHint')}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  <HorsePicker
                    value={pedigreeHorse?.localId ?? null}
                    selectedLabel={pedigreeHorse?.localId ? pedigreeHorse.name : undefined}
                    onChange={(horse) => setPedigreeHorse(toSelectedLocalHorse(horse))}
                    placeholder={isRTL ? 'ابحث في خيول المزرعة' : 'Search farm horses'}
                    title={isRTL ? 'خيول المزرعة' : 'Farm horses'}
                    triggerClassName="min-h-[58px] rounded-2xl border-[#d8c8bc] bg-white px-5 font-bold text-[#3b2b20] shadow-sm transition hover:border-[#8d7769] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#8d7769]/25"
                  />
                  <HorsePicker
                    value={pedigreeHorse?.localId ?? null}
                    selectedLabel={pedigreeHorse?.localId ? pedigreeHorse.name : undefined}
                    onChange={(horse) => setPedigreeHorse(toSelectedLocalHorse(horse))}
                    placeholder={isRTL ? 'ابحث بوسم الخيل' : 'Search by horse tag'}
                    title={isRTL ? 'وسوم الخيول' : 'Horse tags'}
                    searchPlaceholder={isRTL ? 'اكتب الوسم' : 'Type a tag'}
                    queryMode="tag"
                    triggerClassName="min-h-[58px] rounded-2xl border-[#d8c8bc] bg-white px-5 font-bold text-[#3b2b20] shadow-sm transition hover:border-[#8d7769] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#8d7769]/25"
                  />
                  <ExternalHorsePicker
                    value={!pedigreeHorse?.localId ? pedigreeHorse?.studbookId ?? null : null}
                    selectedLabel={!pedigreeHorse?.localId ? pedigreeHorse?.name : undefined}
                    onChange={(horse) => setPedigreeHorse(toSelectedHorse(horse))}
                    placeholder={t('database.selectHorse')}
                    title={t('database.selectHorse')}
                    open={pedigreePickerOpen}
                    onOpenChange={setPedigreePickerOpen}
                    triggerClassName="min-h-[58px] rounded-2xl border-[#d8c8bc] bg-white px-5 font-bold text-[#3b2b20] shadow-sm transition hover:border-[#8d7769] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#8d7769]/25"
                  />
                </div>
                {pedigreeHorse?.tags?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {pedigreeHorse.tags
                      .filter((tag) => tag.name?.trim())
                      .map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full border border-[#e4d6ca] bg-white px-2.5 py-1 text-xs font-bold text-[#6f5b4d]"
                        >
                          {tag.name}
                        </span>
                      ))}
                  </div>
                ) : null}
              </div>

              <div>
                <h2 className="mb-5 text-[1.7rem] font-bold text-[#20203c]">
                  {t('database.pedigreeTab')}
                </h2>
                {pedigreeHorse ? (
                  <HorsePedigreeTree
                    key={pedigreeHorse.localId ?? pedigreeHorse.studbookId}
                    horse={{
                      id: String(pedigreeHorse.localId ?? pedigreeHorse.studbookId),
                      localId: pedigreeHorse.localId,
                      studbookId: pedigreeHorse.studbookId ?? null,
                      name: pedigreeHorse.name,
                    }}
                    showTitle={false}
                    controlsVariant="compact"
                  />
                ) : (
                  <EmptyResult
                    text={t('database.chooseHorseToViewPedigree')}
                    onClick={() => setPedigreePickerOpen(true)}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#3b2b20]">
                    {t('database.fatherName')}
                  </label>
                  <ExternalHorsePicker
                    value={father?.studbookId ?? null}
                    selectedLabel={father?.name}
                    onChange={(horse) => selectParent(horse, setFather)}
                    gender="Male"
                    placeholder={t('database.selectFather')}
                    title={t('database.selectFather')}
                    emptyText={t('database.noFathersFound')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#3b2b20]">
                    {t('database.motherName')}
                  </label>
                  <ExternalHorsePicker
                    value={mother?.studbookId ?? null}
                    selectedLabel={mother?.name}
                    onChange={(horse) => selectParent(horse, setMother)}
                    gender="Female"
                    placeholder={t('database.selectMother')}
                    title={t('database.selectMother')}
                    emptyText={t('database.noMothersFound')}
                  />
                </div>
              </div>

              <div>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-[1.7rem] font-bold text-[#20203c]">
                    {t('database.matingResult')}
                  </h2>
                  <button
                    type="button"
                    onClick={runMatingTest}
                    disabled={!father || !mother || matingLoading}
                    className="rounded-2xl bg-[#4a2b1a] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {matingLoading ? t('database.runningMating') : t('database.runMating')}
                  </button>
                </div>

                {matingMessage && (
                  <div className="mb-4 rounded-2xl border border-[#eadfd6] bg-[#fbf8f4] px-4 py-3 text-sm text-[#6f5b4d]">
                    {matingMessage}
                  </div>
                )}

                {showMatingTree ? (
                  <HorsePedigreeTree
                    horse={{ id: 'test-mating', name: t('database.matingResult') }}
                    pedigreeData={matingTree ?? []}
                    loading={matingLoading}
                    showTitle={false}
                    controlsVariant="compact"
                  />
                ) : (
                  <EmptyResult text={t('database.chooseParentsToRunMating')} />
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}

function EmptyResult({ text, onClick }: { text: string; onClick?: () => void }) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-[26px] border border-dashed border-[#d9c8ba] bg-[#fdfbf9] px-6 py-14 text-center text-sm font-medium text-[#7a6c63] transition hover:border-[#8d7769] hover:bg-[#faf6f1] hover:text-[#3b2b20] focus:outline-none focus:ring-2 focus:ring-[#8d7769]/30"
      >
        {text}
      </button>
    );
  }

  return (
    <div className="rounded-[26px] border border-dashed border-[#d9c8ba] bg-[#fdfbf9] px-6 py-14 text-center text-sm font-medium text-[#7a6c63]">
      {text}
    </div>
  );
}
