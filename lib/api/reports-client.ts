'use client';

import { clientApiFetch } from './client';
import type { ApiResult, LocaleCode, PagedResponse } from './types';

export interface NameCount {
  name: string;
  nameAr: string;
  count: number;
}

export interface MonthlyCount {
  year: number;
  month: number;
  count: number;
}

export interface DashboardReport {
  horses: {
    totalHorses: number;
    stallions: number;
    mares: number;
    colts: number;
    fillies: number;
    foals: number;
    available: number;
    sold: number;
    deceased: number;
    visitors: number;
  };
  housing: {
    totalHoused: number;
    totalCapacity: number;
    occupied: number;
    available: number;
    occupancyRate: number;
  };
  breeding: {
    activeStallionProfiles: number;
    activeMareProfiles: number;
    totalBreedingEvents: number;
    naturalCoverCount: number;
    freshSemenCount: number;
    frozenSemenCount: number;
    embryoTransferCount: number;
    pregnancies: number;
    pregnantMares: number;
    nonPregnantMares: number;
    successRate: number | null;
    liveBirths: number;
    foalRegistrations: number;
  };
  healthcare: {
    totalRecords: number;
    injuredHorses: number;
    healthyHorses: number;
    totalCost: number;
  };
  veterinarians: {
    totalVeterinarians: number;
    topVeterinarians: Array<{
      name: string;
      healthcareCount: number;
      breedingCount: number;
      total: number;
    }>;
  };
}

export interface HorseReport {
  totalHorses: number;
  foals: number;
  colts: number;
  fillies: number;
  stallions: number;
  mares: number;
  unknownGender: number;
  available: number;
  sold: number;
  deceased: number;
  visitors: number;
  ageDistribution: {
    underOneYear: number;
    oneToThreeYears: number;
    threeToFiveYears: number;
    fiveToTenYears: number;
    overTenYears: number;
  };
  birthYearDistribution: Array<{ year: number; count: number }>;
  colorDistribution: NameCount[];
  strainDistribution: NameCount[];
}

export interface BreedingReport {
  horsesWithActiveBreedingProfile: number;
  activeStallionProfiles: number;
  activeMareProfiles: number;
  breedingEventSummary: {
    totalBreedingEvents: number;
    uniqueMaresBred: number;
    naturalCovers: number;
    freshSemenInseminations: number;
    frozenSemenInseminations: number;
    embryoTransfers: number;
  };
  mareSoundnessSummary: {
    totalOvulationExaminations: number;
    totalSoundnessExaminations: number;
    clinicalResultDistribution: {
      pregnant: number;
      empty: number;
      resorbing: number;
      aborted: number;
      pregnantWithTwins: number;
      needsVulvoplasty: number;
      normalRate: number;
    };
    pregnanciesByStallion: NameCount[];
  };
  pregnancyOutcomeSummary: {
    totalPregnancies: number;
    liveBirths: number;
    liveBirthRate: number;
    currentlyPregnant?: number;
    expectedFoalingThisMonth?: number;
  };
  expectedBirthReport?: {
    currentlyPregnantMares: number;
    months: Array<{
      year: number;
      month: number;
      expectedBirths: number;
      mares: ExpectedBirthMare[];
    }>;
    incompleteMares: ExpectedBirthMare[];
  };
  foalReport: {
    totalFoalRegistrations: number;
    nonWeaned: number;
    weaned: number;
    byYear: Array<{ year: number; count: number }>;
    birthStatusDistribution: Array<{ status: string; count: number }>;
  };
  cycleSummary: {
    totalCycles: number;
    openCycles: number;
    closedCycles: number;
    averageDurationDays: number;
    monthlyTrend: MonthlyCount[];
  };
}

export interface ExpectedBirthMare {
  mareId: number;
  profileId: number;
  mareName: string;
  mareNameAr: string;
  stallionName: string | null;
  expectedFoalingStartDate: string | null;
  expectedFoalingEndDate: string | null;
  lastExamDate: string;
  missingReason: string | null;
}

export interface HealthcareReport {
  totalRecords: number;
  horsesTreated: number;
  totalCost: number;
  avgCostPerRecord: number;
  avgCostPerHorse: number;
  byCategory: Array<{
    category: string;
    categoryAr: string;
    count: number;
    totalCost: number;
  }>;
  injurySeverityDistribution: NameCount[];
  vaccinationTypeDistribution: NameCount[];
  monthlyTrend: MonthlyCount[];
  topTreatedHorses: Array<{
    horseId: number;
    horseName: string;
    horseNameAr: string;
    visitCount: number;
  }>;
  veterinarianDistribution: NameCount[];
}

export interface MonthlyPnL {
  year: number;
  month: number;
  expense: number;
  revenue: number;
  profit: number;
  transactionCount: number;
}

function unwrap<T>(payload: ApiResult<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload && !Array.isArray(payload)) {
    return (payload as ApiResult<T>).data as T;
  }
  return payload as T;
}

function get<T>(locale: LocaleCode, path: string, query?: Record<string, string | number | undefined>) {
  return clientApiFetch<T>({
    backendPath: path,
    nextPath: path,
    query,
    locale,
  });
}

export async function getDashboardReport(locale: LocaleCode) {
  return unwrap(await get<ApiResult<DashboardReport>>(locale, '/api/reports/dashboard'));
}

export async function getHorseReport(locale: LocaleCode) {
  return unwrap(await get<ApiResult<HorseReport>>(locale, '/api/reports/horses'));
}

export async function getBreedingReport(locale: LocaleCode, startDate?: string, endDate?: string) {
  return unwrap(
    await get<ApiResult<BreedingReport>>(locale, '/api/reports/breeding', { startDate, endDate }),
  );
}

export async function getHealthcareReport(locale: LocaleCode, startDate?: string, endDate?: string) {
  return unwrap(
    await get<ApiResult<HealthcareReport>>(locale, '/api/reports/healthcare', { startDate, endDate }),
  );
}

export async function getMonthlyPnL(locale: LocaleCode, year: number) {
  const payload = await get<ApiResult<PagedResponse<MonthlyPnL>>>(locale, '/api/reports/finance/monthly', {
    year,
    pageNumber: 1,
    pageSize: 12,
  });
  return unwrap(payload)?.data ?? [];
}
