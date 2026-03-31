import { NextResponse } from "next/server";

import { listCubes } from "@/server/ibm-pa/client";
import {
  createIbmPaErrorPayload,
  parseCubesQuery,
} from "@/server/ibm-pa/route-utils";

export const dynamic = "force-dynamic";

export const GET = async (request: Request): Promise<NextResponse> => {
  try {
    const url = new URL(request.url);
    const query = parseCubesQuery(url.searchParams);
    const result = await listCubes(
      query.server
        ? {
            serverName: query.server,
          }
        : undefined,
    );

    return NextResponse.json(result);
  } catch (error) {
    const errorPayload = createIbmPaErrorPayload(error);

    return NextResponse.json(errorPayload.body, {
      status: errorPayload.status,
    });
  }
};
