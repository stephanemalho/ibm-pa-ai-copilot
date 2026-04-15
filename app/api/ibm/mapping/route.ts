import { NextResponse } from "next/server";

import { getMetadataMapping } from "@/server/ibm-pa/client";
import {
  createIbmPaErrorPayload,
  parseMappingQuery,
} from "@/server/ibm-pa/route-utils";

export const dynamic = "force-dynamic";

export const GET = async (request: Request): Promise<NextResponse> => {
  try {
    const url = new URL(request.url);
    const query = parseMappingQuery(url.searchParams);
    const result = await getMetadataMapping({
      includeProcesses: query.includeProcesses,
      maxCubes: query.maxCubes,
      ...(query.server
        ? {
            serverName: query.server,
          }
        : {}),
    });

    return NextResponse.json(result);
  } catch (error) {
    const errorPayload = createIbmPaErrorPayload(error);

    return NextResponse.json(errorPayload.body, {
      status: errorPayload.status,
    });
  }
};
