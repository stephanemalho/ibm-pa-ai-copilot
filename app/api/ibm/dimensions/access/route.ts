import { NextResponse } from "next/server";

import { getDimensionAccessibilityDiagnostics } from "@/server/ibm-pa/client";
import {
  createIbmPaErrorPayload,
  parseDimensionsQuery,
} from "@/server/ibm-pa/route-utils";

export const dynamic = "force-dynamic";

export const GET = async (request: Request): Promise<NextResponse> => {
  try {
    const url = new URL(request.url);
    const query = parseDimensionsQuery(url.searchParams);

    if (!query.server) {
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

    const result = await getDimensionAccessibilityDiagnostics({
      cubeName: query.cube,
      ...(query.sampleSize === undefined
        ? {}
        : {
            sampleSize: query.sampleSize,
          }),
      serverName: query.server,
    });

    return NextResponse.json(result);
  } catch (error) {
    const errorPayload = createIbmPaErrorPayload(error);

    return NextResponse.json(errorPayload.body, {
      status: errorPayload.status,
    });
  }
};
