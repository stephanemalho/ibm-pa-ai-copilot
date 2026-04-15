import { NextResponse } from "next/server";

import { getRecentMessageLogs } from "@/server/ibm-pa/client";
import {
  createIbmPaErrorPayload,
  parseLogsQuery,
} from "@/server/ibm-pa/route-utils";

export const dynamic = "force-dynamic";

export const GET = async (request: Request): Promise<NextResponse> => {
  try {
    const url = new URL(request.url);
    const query = parseLogsQuery(url.searchParams);
    const result = await getRecentMessageLogs({
      ...(query.level
        ? {
            level: query.level,
          }
        : {}),
      limit: query.limit,
      minutes: query.minutes,
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
