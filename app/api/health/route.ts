import { NextResponse } from "next/server";

import { getHealthcheckResponse } from "@/server/health/get-healthcheck-response";

export const dynamic = "force-dynamic";

export const GET = (): NextResponse => {
  return NextResponse.json(getHealthcheckResponse());
};
