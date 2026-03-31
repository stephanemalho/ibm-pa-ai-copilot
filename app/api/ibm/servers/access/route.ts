import { NextResponse } from "next/server";

import { getServerAccessibilityDiagnostics } from "@/server/ibm-pa/client";
import { createIbmPaErrorPayload } from "@/server/ibm-pa/route-utils";

export const dynamic = "force-dynamic";

export const GET = async (): Promise<NextResponse> => {
  try {
    const result = await getServerAccessibilityDiagnostics();

    return NextResponse.json(result);
  } catch (error) {
    const errorPayload = createIbmPaErrorPayload(error);

    return NextResponse.json(errorPayload.body, {
      status: errorPayload.status,
    });
  }
};
