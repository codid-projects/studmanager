import { HorseProfilePageClient } from '@/components/horses/HorseProfilePageClient';
import { redirect } from 'next/navigation';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { getHorseWithListFallback } from '@/lib/api/horses-service';
import { isDirectApiMode } from '@/lib/api/transport';
import type { LocaleCode } from '@/lib/api/types';

interface HorseProfilePageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function HorseProfilePage({ params }: HorseProfilePageProps) {
  const { locale: routeLocale, id } = await params;
  const locale = (routeLocale === 'en' ? 'en' : 'ar') as LocaleCode;

  if (isDirectApiMode) {
    return (
      <HorseProfilePageClient
        horseId={id}
        horse={null}
        offsprings={null}
        siblings={null}
      />
    );
  }

  try {
    const horse = await getHorseWithListFallback(id);

    return (
      <HorseProfilePageClient
        horseId={id}
        horse={horse}
        offsprings={null}
        siblings={null}
      />
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect(`/${locale}/login?session=expired`);
    }

    const message = error instanceof Error ? error.message : null;

    return (
      <HorseProfilePageClient
        horseId={id}
        horse={null}
        offsprings={null}
        siblings={null}
        error={localizeApiMessage(message, locale)}
      />
    );
  }
}
