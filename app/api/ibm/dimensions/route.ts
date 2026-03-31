import { NextResponse } from "next/server";

import {
  getCubeDimensions,
  getCubeSampleMembers,
} from "@/server/ibm-pa/client";
import {
  createIbmPaErrorPayload,
  parseDimensionsQuery,
} from "@/server/ibm-pa/route-utils";

export const dynamic = "force-dynamic";

export const GET = async (request: Request): Promise<NextResponse> => {
  try {
    const url = new URL(request.url);
    const query = parseDimensionsQuery(url.searchParams);
    const dimensionsParams = query.server
      ? {
          cubeName: query.cube,
          serverName: query.server,
        }
      : {
          cubeName: query.cube,
        };
    const sampleMembersParams = {
      ...dimensionsParams,
      ...(query.sampleSize === undefined
        ? {}
        : {
            sampleSize: query.sampleSize,
          }),
    };
    const [dimensions, sampleMembers] = await Promise.all([
      getCubeDimensions(dimensionsParams),
      getCubeSampleMembers(sampleMembersParams),
    ]);

    return NextResponse.json({
      cubeName: query.cube,
      dimensions: dimensions.dimensions,
      members: sampleMembers.members,
      mode: dimensions.mode,
      serverName: dimensions.serverName,
    });
  } catch (error) {
    const errorPayload = createIbmPaErrorPayload(error);

    return NextResponse.json(errorPayload.body, {
      status: errorPayload.status,
    });
  }
};
