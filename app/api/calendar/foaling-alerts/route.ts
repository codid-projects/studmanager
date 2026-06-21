import { NextRequest, NextResponse } from "next/server";
import { getFoalingAlerts } from "@/lib/api/calendar-service";
import { apiRouteError } from "@/lib/api/route-response";
import type { LocaleCode } from "@/lib/api/types";

export async function GET(request: NextRequest) {
  const locale: LocaleCode = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "ar";
  const daysAhead = Number(request.nextUrl.searchParams.get("daysAhead") || 45);

  try {
    return NextResponse.json(await getFoalingAlerts(Number.isFinite(daysAhead) ? daysAhead : 45));
  } catch (error) {
    return apiRouteError(error, locale);
  }
}
