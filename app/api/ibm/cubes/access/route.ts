import { NextResponse } from "next/server";

import { getCubeAccessibilityDiagnostics } from "@/server/ibm-pa/client";
import {
  createIbmPaErrorPayload,
  parseCubesQuery,
} from "@/server/ibm-pa/route-utils";

export const dynamic = "force-dynamic";

export const GET = async (request: Request): Promise<NextResponse> => {
  try {
    const url = new URL(request.url);
    const query = parseCubesQuery(url.searchParams);
    const serverName = query.server;

    if (!serverName) {
      return NextResponse.json(
        {
          error: {
            code: "IBM_PA_MISSING_SERVER",
            message: "The server query parameter is required.",
          },
        },
        {
          status: 400,
        },
      );
    }

    const result = await getCubeAccessibilityDiagnostics(serverName);

    return NextResponse.json(result);
  } catch (error) {
    const errorPayload = createIbmPaErrorPayload(error);

    return NextResponse.json(errorPayload.body, {
      status: errorPayload.status,
    });
  }
};
