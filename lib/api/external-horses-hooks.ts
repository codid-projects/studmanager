'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { localizeApiMessage } from './errors';
import type { ApiResult, LocaleCode } from './types';
import {
  getExternalHorseDashboard,
  getHorseAwards,
  getHorseChampionships,
  getHorseEvents,
  getHorseFamilyAnalysisTree,
  getHorseOffsprings,
  getHorsePedigree,
  getHorseSiblings,
  getTailFemale,
  getTailMale,
  getTestMatingTree,
  importExternalHorse,
  searchExternalHorses,
  searchExternalStuds,
  syncExternalHorseEvents,
  syncHorseAttachments,
} from './external-horses';

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

function getErrorMessage(error: unknown, locale: LocaleCode) {
  if (error instanceof Error) return localizeApiMessage(error.message, locale);
  return localizeApiMessage(null, locale);
}

function useApiQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  options: { enabled?: boolean; locale?: LocaleCode } = {},
): AsyncState<T> {
  const { enabled = true, locale = 'ar' } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError('');

    try {
      const result = await fetcher();
      setData(result);
    } catch (requestError) {
      const status = typeof requestError === 'object' && requestError && 'status' in requestError
        ? Number((requestError as { status?: number }).status)
        : undefined;

      if (status === 404) {
        setData(null);
        return;
      }

      setError(getErrorMessage(requestError, locale));
    } finally {
      setLoading(false);
    }
  }, [enabled, fetcher, locale]);

  useEffect(() => {
    refetch();
  }, deps);

  return { data, loading, error, refetch };
}

function useMutation<TPayload, TResult>(
  mutator: (payload: TPayload) => Promise<TResult>,
  locale: LocaleCode = 'ar',
) {
  const [data, setData] = useState<TResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mutateAsync = useCallback(
    async (payload: TPayload) => {
      setLoading(true);
      setError('');

      try {
        const result = await mutator(payload);
        setData(result);
        return result;
      } catch (requestError) {
        const message = getErrorMessage(requestError, locale);
        setError(message);
        throw requestError;
      } finally {
        setLoading(false);
      }
    },
    [locale, mutator],
  );

  return { mutateAsync, data, loading, error };
}

export function useSearchExternalHorses(params: Parameters<typeof searchExternalHorses>[0], locale?: LocaleCode) {
  const fetcher = useCallback(() => searchExternalHorses(params), [params.searchTerm, params.pageNumber, params.pageSize]);
  return useApiQuery(fetcher, [fetcher], { locale });
}

export function useSearchExternalStuds(params: Parameters<typeof searchExternalStuds>[0], locale?: LocaleCode) {
  const fetcher = useCallback(() => searchExternalStuds(params), [params.searchTerm, params.pageNumber, params.pageSize]);
  return useApiQuery(fetcher, [fetcher], { locale });
}

export function useImportExternalHorseMutation(locale?: LocaleCode) {
  return useMutation(importExternalHorse, locale);
}

export function useExternalHorseDashboard(localId?: number, locale?: LocaleCode) {
  const fetcher = useCallback(() => getExternalHorseDashboard(localId as number), [localId]);
  return useApiQuery(fetcher, [fetcher], { enabled: Boolean(localId), locale });
}

export function useHorsePedigree(params: Parameters<typeof getHorsePedigree>[0] | null, locale?: LocaleCode) {
  const fetcher = useCallback(() => getHorsePedigree(params as Parameters<typeof getHorsePedigree>[0]), [params?.studbookId, params?.levels]);
  return useApiQuery(fetcher, [fetcher], { enabled: Boolean(params?.studbookId), locale });
}

export function useHorseFamilyAnalysisTree(params: Parameters<typeof getHorseFamilyAnalysisTree>[0] | null, locale?: LocaleCode) {
  const fetcher = useCallback(() => getHorseFamilyAnalysisTree(params as Parameters<typeof getHorseFamilyAnalysisTree>[0]), [params?.studbookId, params?.levels, params?.pageNumber, params?.pageSize]);
  return useApiQuery(fetcher, [fetcher], { enabled: Boolean(params?.studbookId), locale });
}

export function useTailMale(params: Parameters<typeof getTailMale>[0] | null, locale?: LocaleCode) {
  const fetcher = useCallback(() => getTailMale(params as Parameters<typeof getTailMale>[0]), [params?.studbookId, params?.levels, params?.pageNumber, params?.pageSize]);
  return useApiQuery(fetcher, [fetcher], { enabled: Boolean(params?.studbookId), locale });
}

export function useTailFemale(params: Parameters<typeof getTailFemale>[0] | null, locale?: LocaleCode) {
  const fetcher = useCallback(() => getTailFemale(params as Parameters<typeof getTailFemale>[0]), [params?.studbookId, params?.levels, params?.pageNumber, params?.pageSize]);
  return useApiQuery(fetcher, [fetcher], { enabled: Boolean(params?.studbookId), locale });
}

export function useTestMatingTree(params: Parameters<typeof getTestMatingTree>[0], locale?: LocaleCode) {
  const enabled = Boolean(params.horseMotherStudbookId || params.horseFatherStudbookId);
  const fetcher = useCallback(() => getTestMatingTree(params), [params.horseMotherStudbookId, params.horseFatherStudbookId, params.levels]);
  return useApiQuery(fetcher, [fetcher], { enabled, locale });
}

export function useHorseEvents(params: Parameters<typeof getHorseEvents>[0] | null, locale?: LocaleCode) {
  const fetcher = useCallback(() => getHorseEvents(params as Parameters<typeof getHorseEvents>[0]), [params?.localHorseId, params?.pageNumber, params?.pageSize]);
  return useApiQuery(fetcher, [fetcher], { enabled: Boolean(params?.localHorseId), locale });
}

export function useHorseChampionships(params: Parameters<typeof getHorseChampionships>[0] | null, locale?: LocaleCode) {
  const fetcher = useCallback(() => getHorseChampionships(params as Parameters<typeof getHorseChampionships>[0]), [params?.localHorseId, params?.pageNumber, params?.pageSize]);
  return useApiQuery(fetcher, [fetcher], { enabled: Boolean(params?.localHorseId), locale });
}

export function useHorseAwards(params: Parameters<typeof getHorseAwards>[0] | null, locale?: LocaleCode) {
  const fetcher = useCallback(() => getHorseAwards(params as Parameters<typeof getHorseAwards>[0]), [params?.localHorseId, params?.pageNumber, params?.pageSize]);
  return useApiQuery(fetcher, [fetcher], { enabled: Boolean(params?.localHorseId), locale });
}

export function useSyncExternalHorseEventsMutation(locale?: LocaleCode) {
  return useMutation(async (_payload: void) => syncExternalHorseEvents(), locale);
}

export function useHorseSiblings(params: Parameters<typeof getHorseSiblings>[0] | null, locale?: LocaleCode) {
  const fetcher = useCallback(() => getHorseSiblings(params as Parameters<typeof getHorseSiblings>[0]), [params?.localId, params?.search, params?.pageNumber, params?.pageSize]);
  return useApiQuery(fetcher, [fetcher], { enabled: Boolean(params?.localId), locale });
}

export function useHorseOffsprings(params: Parameters<typeof getHorseOffsprings>[0] | null, locale?: LocaleCode) {
  const fetcher = useCallback(() => getHorseOffsprings(params as Parameters<typeof getHorseOffsprings>[0]), [params?.localId, params?.search, params?.pageNumber, params?.pageSize]);
  return useApiQuery(fetcher, [fetcher], { enabled: Boolean(params?.localId), locale });
}

export function useSyncHorseAttachmentsMutation(locale?: LocaleCode) {
  return useMutation((localId: number) => syncHorseAttachments(localId), locale);
}

export function useMutationMessage(result: ApiResult<unknown> | null, locale: LocaleCode) {
  return useMemo(() => localizeApiMessage(result?.message, locale), [result?.message, locale]);
}
