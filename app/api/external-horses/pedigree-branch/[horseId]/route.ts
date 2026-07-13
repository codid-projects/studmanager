import { NextRequest, NextResponse } from "next/server";
import { ApiError, localizeApiMessage } from "@/lib/api/errors";
import { apiFetch } from "@/lib/api/http";
import type { ApiResult, HorsePedigreeNode, LocaleCode } from "@/lib/api/types";

interface PedigreeBranchRouteProps {
  params: Promise<{ horseId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: PedigreeBranchRouteProps,
) {
  const { horseId } = await params;
  const locale = (request.nextUrl.searchParams.get("locale") === "en"
    ? "en"
    : "ar") as LocaleCode;
  const passthroughQuery = Object.fromEntries(request.nextUrl.searchParams);
  delete passthroughQuery.locale;
  passthroughQuery.levels = passthroughQuery.levels ?? "3";

  try {
    const result = await apiFetch<ApiResult<HorsePedigreeNode[][]>>(
      `/api/ExternalHorses/pedigree-branch/${horseId}`,
      { query: passthroughQuery },
    );

    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : null;

    return NextResponse.json(
      {
        succeeded: false,
        message: localizeApiMessage(message, locale),
        statusCode: status,
      },
      { status },
    );
  }
}
