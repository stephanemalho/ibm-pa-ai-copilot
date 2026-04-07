import { NextResponse } from "next/server";
import { z } from "zod";

import { getCubeComparator } from "@/server/ibm-pa/comparator";
import { createIbmPaErrorPayload } from "@/server/ibm-pa/route-utils";

export const dynamic = "force-dynamic";

const comparatorFilterSchema = z.object({
  dimensionName: z.string().trim().min(1),
  hierarchyName: z.string().trim().min(1).optional(),
  memberName: z.string().trim().min(1),
});

const comparatorRequestSchema = z.object({
  baseMemberName: z.string().trim().min(1),
  compareMemberName: z.string().trim().min(1),
  comparisonDimensionHierarchyName: z.string().trim().min(1).optional(),
  comparisonDimensionName: z.string().trim().min(1),
  contextFilters: z.array(comparatorFilterSchema).max(20),
  cubeName: z.string().trim().min(1),
  rowDimensionHierarchyName: z.string().trim().min(1).optional(),
  rowDimensionName: z.string().trim().min(1),
  rowLimit: z.number().int().min(1).max(20).optional(),
  serverName: z.string().trim().min(1).optional(),
});

export const POST = async (request: Request): Promise<NextResponse> => {
  try {
    const requestBody = (await request.json()) as unknown;
    const comparatorRequest = comparatorRequestSchema.parse(requestBody);
    const comparatorResult = await getCubeComparator({
      baseMemberName: comparatorRequest.baseMemberName,
      compareMemberName: comparatorRequest.compareMemberName,
      ...(comparatorRequest.comparisonDimensionHierarchyName
        ? {
            comparisonDimensionHierarchyName:
              comparatorRequest.comparisonDimensionHierarchyName,
          }
        : {}),
      comparisonDimensionName: comparatorRequest.comparisonDimensionName,
      contextFilters: comparatorRequest.contextFilters.map((filter) => {
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
      cubeName: comparatorRequest.cubeName,
      ...(comparatorRequest.rowDimensionHierarchyName
        ? {
            rowDimensionHierarchyName: comparatorRequest.rowDimensionHierarchyName,
          }
        : {}),
      rowDimensionName: comparatorRequest.rowDimensionName,
      ...(comparatorRequest.rowLimit === undefined
        ? {}
        : {
            rowLimit: comparatorRequest.rowLimit,
          }),
      ...(comparatorRequest.serverName
        ? {
            serverName: comparatorRequest.serverName,
          }
        : {}),
    });

    return NextResponse.json(comparatorResult);
  } catch (error) {
    const errorPayload = createIbmPaErrorPayload(error);

    return NextResponse.json(errorPayload.body, {
      status: errorPayload.status,
    });
  }
};
