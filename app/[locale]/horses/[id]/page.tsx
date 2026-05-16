import { HorseProfilePageClient } from '@/components/horses/HorseProfilePageClient';
import { redirect } from 'next/navigation';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { getHorseOffsprings, getHorseSiblings, getHorseWithListFallback } from '@/lib/api/horses-service';
import { isDirectApiMode } from '@/lib/api/transport';
import type { LocaleCode } from '@/lib/api/types';

interface HorseProfilePageProps {
  params: Promise<{ locale: string; id: string }>;
}

function ignoreNonAuthError<T>(promise: Promise<T>) {
  return promise.catch((error) => {
    if (error instanceof ApiError && error.status === 401) throw error;
    return null;
  });
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
    const [offsprings, siblings] = await Promise.all([
      ignoreNonAuthError(getHorseOffsprings(id)),
      ignoreNonAuthError(getHorseSiblings(id)),
    ]);

    return (
      <HorseProfilePageClient
        horseId={id}
        horse={horse}
        offsprings={offsprings}
        siblings={siblings}
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
