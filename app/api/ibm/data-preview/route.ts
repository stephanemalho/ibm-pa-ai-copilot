import { NextResponse } from "next/server";
import { z } from "zod";

import { getCubeDataPreview } from "@/server/ibm-pa/data-preview";
import { createIbmPaErrorPayload } from "@/server/ibm-pa/route-utils";

export const dynamic = "force-dynamic";

const previewFilterSchema = z.object({
  dimensionName: z.string().trim().min(1),
  hierarchyName: z.string().trim().min(1).optional(),
  memberName: z.string().trim().min(1),
});

const previewRequestSchema = z.object({
  cubeName: z.string().trim().min(1),
  filters: z.array(previewFilterSchema).max(20),
  rowDimensionHierarchyName: z.string().trim().min(1).optional(),
  rowDimensionName: z.string().trim().min(1),
  rowLimit: z.number().int().min(1).max(10).optional(),
  serverName: z.string().trim().min(1).optional(),
});

export const POST = async (request: Request): Promise<NextResponse> => {
  try {
    const requestBody = (await request.json()) as unknown;
    const previewRequest = previewRequestSchema.parse(requestBody);
    const previewResult = await getCubeDataPreview({
      cubeName: previewRequest.cubeName,
      filters: previewRequest.filters.map((filter) => {
        return {
          dimensionName: filter.dimensionName,
          memberName: filter.memberName,
          ...(filter.hierarchyName
            ? {
                hierarchyName: filter.hierarchyName,
              }
            : {}),
        };
      }),
      ...(previewRequest.rowDimensionHierarchyName
        ? {
            rowDimensionHierarchyName: previewRequest.rowDimensionHierarchyName,
          }
        : {}),
      rowDimensionName: previewRequest.rowDimensionName,
      ...(previewRequest.rowLimit === undefined
        ? {}
        : {
            rowLimit: previewRequest.rowLimit,
          }),
      ...(previewRequest.serverName
        ? {
            serverName: previewRequest.serverName,
          }
        : {}),
    });

    return NextResponse.json(previewResult);
  } catch (error) {
    const errorPayload = createIbmPaErrorPayload(error);

    return NextResponse.json(errorPayload.body, {
      status: errorPayload.status,
    });
  }
};
