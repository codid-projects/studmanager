import { HorsesPageClient } from '@/components/horses/HorsesPageClient';
import { redirect } from 'next/navigation';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { getHorses } from '@/lib/api/horses-service';
import { isDirectApiMode } from '@/lib/api/transport';
import type { LocaleCode } from '@/lib/api/types';

interface HorsesPageProps {
  params: Promise<{ locale: string }>;
}

const emptyPage = {
  data: [],
  currentPage: 1,
  pageSize: 24,
  totalCount: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
  succeeded: false,
  messages: [],
  extraInfo: null,
};

export default async function HorsesPage({ params }: HorsesPageProps) {
  const { locale: routeLocale } = await params;
  const locale = (routeLocale === 'en' ? 'en' : 'ar') as LocaleCode;

  if (isDirectApiMode) {
    return <HorsesPageClient initialHorses={emptyPage} initialStudbook={{ ...emptyPage, pageSize: 12 }} />;
  }

  try {
    const horses = await getHorses({ pageNumber: 1, pageSize: 24 });

    return <HorsesPageClient initialHorses={horses} initialStudbook={{ ...emptyPage, pageSize: 12 }} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect(`/${locale}/login?session=expired`);
    }

    const message = error instanceof Error ? error.message : null;

    return (
      <HorsesPageClient
        initialHorses={emptyPage}
        initialStudbook={{ ...emptyPage, pageSize: 12 }}
        initialError={localizeApiMessage(message, locale)}
      />
    );
  }
}
