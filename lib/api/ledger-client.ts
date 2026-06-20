import { clientApiFetch } from "./client";
import type { ApiResult, LocaleCode } from "./types";

export interface LedgerLine {
  accountName: string;
  entryType: number;
  amount: number;
}

export interface LedgerTransaction {
  id: number;
  code: string;
  date: string;
  descriptionEn: string;
  descriptionAr: string;
  totalAmount: number;
  currency: "EGP";
  direction: "expense" | "revenue";
  category: string;
  subtypeEn: string;
  subtypeAr: string;
  horseId?: number | null;
  horseName?: string | null;
  horseNameAr?: string | null;
  lines: LedgerLine[];
}

export interface LedgerPage {
  data: LedgerTransaction[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export async function getLedgerTransactions(
  locale: LocaleCode,
  direction: "expense" | "revenue",
  pageNumber: number,
  category = "breeding",
) {
  const result = await clientApiFetch<ApiResult<LedgerPage>>({
    method: "GET",
    backendPath: "/api/ledger",
    nextPath: "/api/ledger",
    query: { direction, category, pageNumber, pageSize: 20 },
    locale,
  });
  if (!result.succeeded || !result.data)
    throw new Error(result.message ?? "Failed to load ledger");
  return result.data;
}
