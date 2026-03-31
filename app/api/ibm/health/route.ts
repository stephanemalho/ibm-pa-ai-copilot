import { NextResponse } from "next/server";

import { getHealth } from "@/server/ibm-pa/client";
import { createIbmPaErrorPayload } from "@/server/ibm-pa/route-utils";

export const dynamic = "force-dynamic";

export const GET = async (): Promise<NextResponse> => {
  try {
    const health = await getHealth();

    return NextResponse.json(health);
  } catch (error) {
    const errorPayload = createIbmPaErrorPayload(error);

    return NextResponse.json(errorPayload.body, {
      status: errorPayload.status,
    });
  }
};
