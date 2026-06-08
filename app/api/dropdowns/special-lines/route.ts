import { NextRequest, NextResponse } from "next/server";
import { getSpecialLines } from "@/lib/api/lineage-service";
import { apiRouteError } from "@/lib/api/route-response";
import type { LocaleCode } from "@/lib/api/types";

export async function GET(request: NextRequest) {
  const locale = (request.nextUrl.searchParams.get("locale") === "en" ? "en" : "ar") as LocaleCode;

  try {
    return NextResponse.json(await getSpecialLines());
  } catch (error) {
    return apiRouteError(error, locale);
  }
}
