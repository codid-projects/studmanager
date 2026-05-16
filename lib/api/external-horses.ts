'use client';

import { clientApiFetch } from './client';
import type {
  ApiResult,
  ExternalHorseDashboardInformation,
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

export const normalizePagedList = <T>(result?: ApiResult<PagedResponse<T>>) => ({
  items: result?.data?.data ?? [],
  hasNextPage: result?.data?.hasNextPage ?? false,
  currentPage: result?.data?.currentPage ?? 1,
  totalPages: result?.data?.totalPages ?? 1,
  totalCount: result?.data?.totalCount ?? 0,
});

export const externalHorseQueryKeys = {
  searchHorses: (searchTerm?: string, pageNumber = 1, pageSize = 20) =>
    ['external-horses', 'search', searchTerm, pageNumber, pageSize] as const,
  searchStuds: (searchTerm?: string, pageNumber = 1, pageSize = 20) =>
    ['external-studs', 'search', searchTerm, pageNumber, pageSize] as const,
  dashboard: (localId: number) => ['horse', localId, 'dashboard'] as const,
  pedigree: (studbookId: number, levels = 6) => ['horse', studbookId, 'pedigree', levels] as const,
  analysisTree: (studbookId: number, levels = 12, pageNumber = 1, pageSize = 20) =>
    ['horse', studbookId, 'analysis-tree', levels, pageNumber, pageSize] as const,
  tailMale: (studbookId: number, levels = 12, pageNumber = 1, pageSize = 20) =>
    ['horse', studbookId, 'tail-male', levels, pageNumber, pageSize] as const,
  tailFemale: (studbookId: number, levels = 12, pageNumber = 1, pageSize = 20) =>
    ['horse', studbookId, 'tail-female', levels, pageNumber, pageSize] as const,
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

export const searchExternalHorses = async ({
  searchTerm,
  pageNumber = 1,
  pageSize = 20,
}: {
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<ApiResult<PagedResponse<ExternalHorseSearchItem>>> =>
  unwrap(
    await clientApiFetch<ApiResult<PagedResponse<ExternalHorseSearchItem>> | PagedResponse<ExternalHorseSearchItem>>({
      backendPath: '/api/ExternalHorses/search-external-horses',
      nextPath: '/api/horses/studbook',
      backendQuery: { SearchTerm: searchTerm, PageNumber: pageNumber, PageSize: pageSize },
      nextQuery: { search: searchTerm, pageNumber, pageSize },
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

export const getHorsePedigree = async ({
  studbookId,
  levels = 6,
}: {
  studbookId: number;
  levels?: number;
}): Promise<ApiResult<HorsePedigreeNode[][]>> =>
  clientApiFetch<ApiResult<HorsePedigreeNode[][]>>({
    backendPath: `/api/ExternalHorses/${studbookId}/pedigree`,
    nextPath: `/api/external-horses/${studbookId}/pedigree`,
    query: { levels },
  });

export const getHorseFamilyAnalysisTree = async ({
  studbookId,
  levels = 12,
  pageNumber = 1,
  pageSize = 20,
}: {
  studbookId: number;
  levels?: number;
  pageNumber?: number;
  pageSize?: number;
}): Promise<ApiResult<PagedResponse<HorseFamilyTreeItem>>> =>
  clientApiFetch<ApiResult<PagedResponse<HorseFamilyTreeItem>>>({
    backendPath: `/api/ExternalHorses/${studbookId}/analysis-tree`,
    nextPath: `/api/external-horses/${studbookId}/analysis-tree`,
    query: { levels, pageNumber, pageSize },
  });

export const getTailMale = async ({
  studbookId,
  levels = 12,
  pageNumber = 1,
  pageSize = 20,
}: {
  studbookId: number;
  levels?: number;
  pageNumber?: number;
  pageSize?: number;
}): Promise<ApiResult<PagedResponse<ExternalTailNode>>> =>
  clientApiFetch<ApiResult<PagedResponse<ExternalTailNode>>>({
    backendPath: `/api/ExternalHorses/${studbookId}/tail-male`,
    nextPath: `/api/external-horses/${studbookId}/tail-male`,
    query: { levels, pageNumber, pageSize },
  });

export const getTailFemale = async ({
  studbookId,
  levels = 12,
  pageNumber = 1,
  pageSize = 20,
}: {
  studbookId: number;
  levels?: number;
  pageNumber?: number;
  pageSize?: number;
}): Promise<ApiResult<PagedResponse<ExternalTailNode>>> =>
  clientApiFetch<ApiResult<PagedResponse<ExternalTailNode>>>({
    backendPath: `/api/ExternalHorses/${studbookId}/tail-female`,
    nextPath: `/api/external-horses/${studbookId}/tail-female`,
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
}): Promise<ApiResult<ExternalTreeNode[][]>> =>
  clientApiFetch<ApiResult<ExternalTreeNode[][]>>({
    backendPath: '/api/ExternalHorses/testmating',
    nextPath: '/api/external-horses/testmating',
    query: { horseMotherStudbookId, horseFatherStudbookId, levels },
  });

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
