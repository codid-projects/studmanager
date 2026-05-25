import { apiFetch } from './http';
import type { ExternalNewsFeedResponse, PagedResponse } from './types';

export async function getNewsfeed(params: {
  mediaType?: string;
  categories?: string;
  pageNumber?: number;
  pageSize?: number;
} = {}) {
  return apiFetch<PagedResponse<ExternalNewsFeedResponse>>('/api/ExternalHorses/newsfeed', {
    query: {
      mediaType: params.mediaType,
      categories: params.categories,
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 10,
    },
  });
}
