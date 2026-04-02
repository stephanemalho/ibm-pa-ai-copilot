import { NextResponse } from "next/server";

import { getDimensionAccessibilityDiagnostic } from "@/server/ibm-pa/client";
import { getIbmPaMode } from "@/server/ibm-pa/env";
import {
  createIbmPaErrorPayload,
  parseDimensionDetailQuery,
} from "@/server/ibm-pa/route-utils";

export const dynamic = "force-dynamic";

export const GET = async (request: Request): Promise<NextResponse> => {
  try {
    const url = new URL(request.url);
    const query = parseDimensionDetailQuery(url.searchParams);
    const dimension = await getDimensionAccessibilityDiagnostic({
      cubeName: query.cube,
      dimensionName: query.dimension,
      ...(query.sampleSize === undefined
        ? {}
        : {
            sampleSize: query.sampleSize,
          }),
      serverName: query.server,
    });

    return NextResponse.json({
      cubeName: query.cube,
      dimension,
      mode: getIbmPaMode(),
      serverName: query.server,
    });
  } catch (error) {
    const errorPayload = createIbmPaErrorPayload(error);

    return NextResponse.json(errorPayload.body, {
      status: errorPayload.status,
    });
  }
};
