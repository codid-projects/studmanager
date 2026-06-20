import { clientApiFetch } from "./client";
import type { ApiResult, LocaleCode, PagedResponse } from "./types";

export type StallionSection =
  | "breeding-events"
  | "semen-collections"
  | "semen-shipments"
  | "soundness-examinations";

export type StallionDashboard = {
  profileId: number;
  totalBreedingEvents: number;
  totalCollections: number;
  totalShipments: number;
  totalSoundnessExams: number;
  averageMotility: number | null;
  lastCollectionDate: string | null;
  lastShipmentDate: string | null;
};

export type StallionRecord = {
  id: number;
  profileId: number;
  recordDate: string;
  recordType: number;
  veterinarianName: string;
  relatedHorseName: string | null;
  relatedHorseNameAr: string | null;
  destination: string | null;
  motilityPercent: number | null;
  totalCost: number;
  hasFollowUp: boolean;
};
export type StallionRecordDetail = StallionRecord &
  Record<string, unknown> & {
    followUpDate?: string | null;
    followUpNotes?: string | null;
    veterinarianComments?: string | null;
    mareId?: number | null;
    surrogateMareId?: number | null;
    mareName?: string | null;
    mareNameAr?: string | null;
    billedServices?: Array<{
      id: number;
      serviceName: string;
      serviceType?: string | null;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  };

function unwrap<T>(value: ApiResult<T>): T {
  return value.data as T;
}

function request<T>(
  locale: LocaleCode,
  method: string,
  path: string,
  body?: unknown,
) {
  return clientApiFetch<T>({
    method,
    backendPath: path,
    nextPath: path,
    body,
    locale,
  });
}

export async function getStallionDashboard(
  locale: LocaleCode,
  profileId: number,
) {
  return unwrap(
    await request<ApiResult<StallionDashboard>>(
      locale,
      "GET",
      `/api/stallion-breeding/profiles/${profileId}/dashboard`,
    ),
  );
}

export async function listStallionRecords(
  locale: LocaleCode,
  profileId: number,
  section: StallionSection,
) {
  const result = await clientApiFetch<ApiResult<PagedResponse<StallionRecord>>>(
    {
      method: "GET",
      backendPath: `/api/stallion-breeding/${section}`,
      nextPath: `/api/stallion-breeding/${section}`,
      query: { profileId, pageNumber: 1, pageSize: 50 },
      locale,
    },
  );
  return unwrap(result);
}

export function createStallionRecord(
  locale: LocaleCode,
  section: StallionSection,
  formData: FormData,
) {
  return request<ApiResult<number>>(
    locale,
    "POST",
    `/api/stallion-breeding/${section}`,
    formData,
  );
}

export function updateStallionRecord(
  locale: LocaleCode,
  section: StallionSection,
  id: number,
  formData: FormData,
) {
  return request<ApiResult<null>>(
    locale,
    "PUT",
    `/api/stallion-breeding/${section}/${id}`,
    formData,
  );
}
export async function getStallionRecord(
  locale: LocaleCode,
  section: StallionSection,
  id: number,
) {
  return unwrap(
    await request<ApiResult<StallionRecordDetail>>(
      locale,
      "GET",
      `/api/stallion-breeding/${section}/${id}`,
    ),
  );
}

export function deleteStallionRecord(
  locale: LocaleCode,
  section: StallionSection,
  id: number,
) {
  return request<ApiResult<null>>(
    locale,
    "DELETE",
    `/api/stallion-breeding/${section}/${id}`,
  );
}
