import { z } from "zod";

import { getCubeWorkspaceRoute } from "@/shared/lib/routes";
import type { WorkspacePreviewContextSelection } from "@/features/ibm-pa/lib/workspace-state-types";

const previewContextSelectionSchema = z.object({
  dimensionName: z.string().trim().min(1),
  memberName: z.string().trim().min(1),
});

type CubeWorkspaceAnalysisPanel = "preview" | "compare";

type CubeWorkspaceHrefParams = {
  analysisPanel?: CubeWorkspaceAnalysisPanel | undefined;
  businessFlowId?: string | undefined;
  comparatorBaseMemberName?: string | undefined;
  comparatorCompareMemberName?: string | undefined;
  comparatorComparisonDimensionName?: string | undefined;
  comparatorContextSelections?: WorkspacePreviewContextSelection[] | undefined;
  comparatorRowDimensionName?: string | undefined;
  cubeName: string;
  fromSearch?: string | undefined;
  previewContextSelections?: WorkspacePreviewContextSelection[] | undefined;
  previewRowDimensionName?: string | undefined;
  selectedDimensionName?: string | undefined;
  serverName: string;
};

const getCubeWorkspaceHref = (params: CubeWorkspaceHrefParams): string => {
  const baseHref = getCubeWorkspaceRoute(params.cubeName, params.serverName);
  const search = new URLSearchParams();

  if (params.selectedDimensionName) {
    search.set("dimension", params.selectedDimensionName);
  }

  if (params.analysisPanel) {
    search.set("panel", params.analysisPanel);
  }

  if (params.businessFlowId) {
    search.set("flow", params.businessFlowId);
  }

  if (params.fromSearch) {
    search.set("fromSearch", params.fromSearch);
  }

  if (params.previewRowDimensionName) {
    search.set("previewRow", params.previewRowDimensionName);
  }

  if (params.comparatorRowDimensionName) {
    search.set("compareRow", params.comparatorRowDimensionName);
  }

  if (params.comparatorComparisonDimensionName) {
    search.set("compareDimension", params.comparatorComparisonDimensionName);
  }

  if (params.comparatorBaseMemberName) {
    search.set("compareBase", params.comparatorBaseMemberName);
  }

  if (params.comparatorCompareMemberName) {
    search.set("compareTarget", params.comparatorCompareMemberName);
  }

  if (
    params.previewContextSelections &&
    params.previewContextSelections.length > 0
  ) {
    search.set(
      "previewContext",
      JSON.stringify(params.previewContextSelections),
    );
  }

  if (
    params.comparatorContextSelections &&
    params.comparatorContextSelections.length > 0
  ) {
    search.set(
      "compareContext",
      JSON.stringify(params.comparatorContextSelections),
    );
  }

  const queryString = search.toString();

  if (!queryString) {
    return baseHref;
  }

  return `${baseHref}?${queryString}`;
};

const parsePreviewContextSelections = (
  value: string | null,
): WorkspacePreviewContextSelection[] => {
  if (!value) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value) as unknown;
    const parsedSelections = z
      .array(previewContextSelectionSchema)
      .safeParse(parsedValue);

    if (!parsedSelections.success) {
      return [];
    }

    return parsedSelections.data;
  } catch {
    return [];
  }
};

export {
  getCubeWorkspaceHref,
  parsePreviewContextSelections,
  type CubeWorkspaceAnalysisPanel,
};
