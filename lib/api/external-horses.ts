'use client';

import { clientApiFetch } from './client';
import type {
  ApiResult,
  DefaultStudDto,
  ExternalHorseDashboardInformation,
  ExternalHorseSummaryItem,
  ExternalHorseSearchItem,
  ExternalStudSearchItem,
  ExternalTailNode,
  ExternalTreeNode,
  HorseAwardHistory,
  HorseChampionHistory,
  HorseEventHistory,
  HorseFamilyTreeItem,
  HorseOffspring,
  HorsePedigreeNode,
  HorseSiblingsDto,
  ImportHorsePayload,
  PagedResponse,
} from './types';

export const normalizePagedList = <T>(result?: ApiResult<PagedResponse<T>> | PagedResponse<T>) => {
  const page = result && typeof result === 'object' && Array.isArray((result as PagedResponse<T>).data)
    ? result as PagedResponse<T>
    : (result as ApiResult<PagedResponse<T>> | undefined)?.data;

  return {
    items: page?.data ?? [],
    hasNextPage: page?.hasNextPage ?? false,
    hasPreviousPage: page?.hasPreviousPage ?? false,
    currentPage: page?.currentPage ?? 1,
    totalPages: page?.totalPages ?? 1,
    totalCount: page?.totalCount ?? 0,
  };
};

export const externalHorseQueryKeys = {
  searchHorses: (searchTerm?: string, pageNumber = 1, pageSize = 20) =>
    ['external-horses', 'search', searchTerm, pageNumber, pageSize] as const,
  searchStuds: (searchTerm?: string, pageNumber = 1, pageSize = 20) =>
    ['external-studs', 'search', searchTerm, pageNumber, pageSize] as const,
  dashboard: (localId: number) => ['horse', localId, 'dashboard'] as const,
  summary: (studbookId: number) => ['external-horse', studbookId, 'summary'] as const,
  pedigree: (localId: number, levels = 6) => ['horse', localId, 'pedigree', levels] as const,
  analysisTree: (localId: number, levels = 12, pageNumber = 1, pageSize = 20) =>
    ['horse', localId, 'analysis-tree', levels, pageNumber, pageSize] as const,
  tailMale: (localId: number, levels = 12, pageNumber = 1, pageSize = 20) =>
    ['horse', localId, 'tail-male', levels, pageNumber, pageSize] as const,
  tailFemale: (localId: number, levels = 12, pageNumber = 1, pageSize = 20) =>
    ['horse', localId, 'tail-female', levels, pageNumber, pageSize] as const,
  testMating: (horseMotherStudbookId?: number, horseFatherStudbookId?: number, levels = 6) =>
    ['horse', horseMotherStudbookId, horseFatherStudbookId, 'test-mating', levels] as const,
  events: (localHorseId: number, pageNumber = 1, pageSize = 20) =>
    ['horse', localHorseId, 'events', pageNumber, pageSize] as const,
  championships: (localHorseId: number, pageNumber = 1, pageSize = 20) =>
    ['horse', localHorseId, 'championships', pageNumber, pageSize] as const,
  awards: (localHorseId: number, pageNumber = 1, pageSize = 20) =>
    ['horse', localHorseId, 'awards', pageNumber, pageSize] as const,
  siblings: (localId: number, search?: string, pageNumber = 1, pageSize = 20) =>
    ['horse', localId, 'siblings', search, pageNumber, pageSize] as const,
  offsprings: (localId: number, search?: string, pageNumber = 1, pageSize = 20) =>
    ['horse', localId, 'offsprings', search, pageNumber, pageSize] as const,
  defaultStud: () => ['default-stud'] as const,
};

function unwrap<T>(result: ApiResult<T> | T): ApiResult<T> {
  if (result && typeof result === 'object' && 'statusCode' in result && 'succeeded' in result) {
    return result as ApiResult<T>;
  }

  return {
    succeeded: true,
    message: null,
    statusCode: 200,
    data: result as T,
  };
}

function normalizeTreePayload<T>(payload: unknown): T[][] {
  const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : null;
  const data = record?.data;
  const dataRecord = data && typeof data === 'object' ? data as Record<string, unknown> : null;
  const resultRecord = record?.result && typeof record.result === 'object' ? record.result as Record<string, unknown> : null;
  const candidate =
    dataRecord?.result ??
    dataRecord?.data ??
    data ??
    resultRecord?.data ??
    record?.result ??
    payload;

  if (Array.isArray(candidate)) {
    if (candidate.every((level) => Array.isArray(level))) return candidate as T[][];
    return [candidate as T[]];
  }

  if (candidate && typeof candidate === 'object') {
    const candidateRecord = candidate as Record<string, unknown>;
    const levelKeys = Object.keys(candidateRecord).filter((key) => /^level\d+$/i.test(key));

    if (levelKeys.length) {
      return levelKeys
        .sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')))
        .map((key) => candidateRecord[key])
        .filter(Array.isArray) as T[][];
    }

    return [[candidate as T]];
  }

  return [];
}

export const searchExternalHorses = async ({
  searchTerm,
  gender,
  pageNumber = 1,
  pageSize = 20,
}: {
  searchTerm?: string;
  gender?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<ApiResult<PagedResponse<ExternalHorseSearchItem>>> =>
  unwrap(
    await clientApiFetch<ApiResult<PagedResponse<ExternalHorseSearchItem>> | PagedResponse<ExternalHorseSearchItem>>({
      backendPath: '/api/ExternalHorses/search-external-horses',
      nextPath: '/api/horses/studbook',
      backendQuery: { SearchTerm: searchTerm, Gender: gender, PageNumber: pageNumber, PageSize: pageSize },
      nextQuery: { search: searchTerm, gender, pageNumber, pageSize },
    }),
  );

export const searchExternalStuds = async ({
  searchTerm,
  pageNumber = 1,
  pageSize = 20,
}: {
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<ApiResult<PagedResponse<ExternalStudSearchItem>>> =>
  clientApiFetch<ApiResult<PagedResponse<ExternalStudSearchItem>>>({
    backendPath: '/api/ExternalHorses/search-external-studs',
    nextPath: '/api/external-horses/studs',
    backendQuery: { SearchTerm: searchTerm, PageNumber: pageNumber, PageSize: pageSize },
    nextQuery: { search: searchTerm, pageNumber, pageSize },
  });

export const syncExternalStuds = async (): Promise<void> => {
  await clientApiFetch({
    method: 'GET',
    backendPath: '/api/ExternalHorses/sync_studs',
    nextPath: '/api/external-horses/sync-studs',
  });
};

export const getDefaultStud = async (): Promise<ApiResult<DefaultStudDto>> =>
  clientApiFetch<ApiResult<DefaultStudDto>>({
    backendPath: '/default',
    nextPath: '/api/default',
  });

export const importExternalHorse = async (payload: ImportHorsePayload): Promise<ApiResult<number>> =>
  clientApiFetch<ApiResult<number>>({
    method: 'POST',
    backendPath: '/api/ExternalHorses/import-horse',
    nextPath: '/api/horses/import',
    body: payload,
  });

export const getExternalHorseDashboard = async (
  localId: number,
): Promise<ApiResult<ExternalHorseDashboardInformation>> =>
  clientApiFetch<ApiResult<ExternalHorseDashboardInformation>>({
    backendPath: `/api/ExternalHorses/${localId}/dashboard`,
    nextPath: `/api/external-horses/${localId}/dashboard`,
  });

export const getExternalHorseSummary = async (
  studbookId: number,
): Promise<ApiResult<ExternalHorseSummaryItem>> =>
  clientApiFetch<ApiResult<ExternalHorseSummaryItem>>({
    backendPath: `/api/ExternalHorses/${studbookId}/summary`,
    nextPath: `/api/external-horses/${studbookId}/summary`,
  });

export const getHorsePedigree = async ({
  localId,
  levels = 6,
}: {
  localId: number;
  levels?: number;
}): Promise<ApiResult<HorsePedigreeNode[][]>> =>
  clientApiFetch<ApiResult<HorsePedigreeNode[][]>>({
    backendPath: `/api/ExternalHorses/${localId}/pedigree`,
    nextPath: `/api/external-horses/${localId}/pedigree`,
    query: { levels },
  });

export const getHorseFamilyAnalysisTree = async ({
  localId,
  levels = 12,
  pageNumber = 1,
  pageSize = 20,
}: {
  localId: number;
  levels?: number;
  pageNumber?: number;
  pageSize?: number;
}): Promise<ApiResult<PagedResponse<HorseFamilyTreeItem>>> =>
  clientApiFetch<ApiResult<PagedResponse<HorseFamilyTreeItem>>>({
    backendPath: `/api/ExternalHorses/${localId}/analysis-tree`,
    nextPath: `/api/external-horses/${localId}/analysis-tree`,
    query: { levels, pageNumber, pageSize },
  });

export const getTailMale = async ({
  localId,
  levels = 12,
  pageNumber = 1,
  pageSize = 20,
}: {
  localId: number;
  levels?: number;
  pageNumber?: number;
  pageSize?: number;
}): Promise<ApiResult<PagedResponse<ExternalTailNode>>> =>
  clientApiFetch<ApiResult<PagedResponse<ExternalTailNode>>>({
    backendPath: `/api/ExternalHorses/${localId}/tail-male`,
    nextPath: `/api/external-horses/${localId}/tail-male`,
    query: { levels, pageNumber, pageSize },
  });

export const getTailFemale = async ({
  localId,
  levels = 12,
  pageNumber = 1,
  pageSize = 20,
}: {
  localId: number;
  levels?: number;
  pageNumber?: number;
  pageSize?: number;
}): Promise<ApiResult<PagedResponse<ExternalTailNode>>> =>
  clientApiFetch<ApiResult<PagedResponse<ExternalTailNode>>>({
    backendPath: `/api/ExternalHorses/${localId}/tail-female`,
    nextPath: `/api/external-horses/${localId}/tail-female`,
    query: { levels, pageNumber, pageSize },
  });

export const getTestMatingTree = async ({
  horseMotherStudbookId,
  horseFatherStudbookId,
  levels = 6,
}: {
  horseMotherStudbookId?: number;
  horseFatherStudbookId?: number;
  levels?: number;
}): Promise<ApiResult<ExternalTreeNode[][]>> => {
  const response = await clientApiFetch<ApiResult<ExternalTreeNode[][]> | ExternalTreeNode[][] | unknown>({
    backendPath: '/api/ExternalHorses/testmating',
    nextPath: '/api/horses/testmating',
    query: { horseMotherStudbookId, horseFatherStudbookId, levels },
  });

  return {
    succeeded: true,
    message: null,
    statusCode: 200,
    data: normalizeTreePayload<ExternalTreeNode>(response),
  };
};

export const getHorseEvents = async ({
  localHorseId,
  pageNumber = 1,
  pageSize = 20,
}: {
  localHorseId: number;
  pageNumber?: number;
  pageSize?: number;
}): Promise<ApiResult<PagedResponse<HorseEventHistory>>> =>
  clientApiFetch<ApiResult<PagedResponse<HorseEventHistory>>>({
    backendPath: `/api/ExternalHorses/${localHorseId}/events`,
    nextPath: `/api/external-horses/${localHorseId}/events`,
    query: { pageNumber, pageSize },
  });

export const getHorseChampionships = async ({
  localHorseId,
  pageNumber = 1,
  pageSize = 20,
}: {
  localHorseId: number;
  pageNumber?: number;
  pageSize?: number;
}): Promise<ApiResult<PagedResponse<HorseChampionHistory>>> =>
  clientApiFetch<ApiResult<PagedResponse<HorseChampionHistory>>>({
    backendPath: `/api/ExternalHorses/${localHorseId}/championships`,
    nextPath: `/api/external-horses/${localHorseId}/championships`,
    query: { pageNumber, pageSize },
  });

export const getHorseAwards = async ({
  localHorseId,
  pageNumber = 1,
  pageSize = 20,
}: {
  localHorseId: number;
  pageNumber?: number;
  pageSize?: number;
}): Promise<ApiResult<PagedResponse<HorseAwardHistory>>> =>
  clientApiFetch<ApiResult<PagedResponse<HorseAwardHistory>>>({
    backendPath: `/api/ExternalHorses/${localHorseId}/awards`,
    nextPath: `/api/external-horses/${localHorseId}/awards`,
    query: { pageNumber, pageSize },
  });

export const syncExternalHorseEvents = async (): Promise<void> => {
  await clientApiFetch({
    method: 'POST',
    backendPath: '/api/ExternalHorses/sync-events',
    nextPath: '/api/external-horses/sync-events',
  });
};

export const getHorseSiblings = async ({
  localId,
  pageNumber = 1,
  pageSize = 20,
  search,
}: {
  localId: number;
  pageNumber?: number;
  pageSize?: number;
  search?: string;
}): Promise<ApiResult<HorseSiblingsDto>> =>
  clientApiFetch<ApiResult<HorseSiblingsDto>>({
    backendPath: `/api/ExternalHorses/${localId}/siblings`,
    nextPath: `/api/external-horses/${localId}/siblings`,
    query: { pageNumber, pageSize, search },
  });

export const getHorseOffsprings = async ({
  localId,
  pageNumber = 1,
  pageSize = 20,
  search,
}: {
  localId: number;
  pageNumber?: number;
  pageSize?: number;
  search?: string;
}): Promise<ApiResult<PagedResponse<HorseOffspring>>> =>
  clientApiFetch<ApiResult<PagedResponse<HorseOffspring>>>({
    backendPath: `/api/ExternalHorses/${localId}/offsprings`,
    nextPath: `/api/external-horses/${localId}/offsprings`,
    query: { pageNumber, pageSize, search },
  });

export const syncHorseAttachments = async (localId: number): Promise<ApiResult<boolean>> =>
  clientApiFetch<ApiResult<boolean>>({
    method: 'POST',
    backendPath: `/api/ExternalHorses/${localId}/sync-attachments`,
    nextPath: `/api/external-horses/${localId}/sync-attachments`,
  });
