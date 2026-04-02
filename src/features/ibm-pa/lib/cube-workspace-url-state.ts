import { z } from "zod";

import { getCubeWorkspaceRoute } from "@/shared/lib/routes";
import type { WorkspacePreviewContextSelection } from "@/features/ibm-pa/lib/workspace-state-types";

const previewContextSelectionSchema = z.object({
  dimensionName: z.string().trim().min(1),
  memberName: z.string().trim().min(1),
});

type CubeWorkspaceHrefParams = {
  businessFlowId?: string | undefined;
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

  if (params.businessFlowId) {
    search.set("flow", params.businessFlowId);
  }

  if (params.fromSearch) {
    search.set("fromSearch", params.fromSearch);
  }

  if (params.previewRowDimensionName) {
    search.set("previewRow", params.previewRowDimensionName);
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

export { getCubeWorkspaceHref, parsePreviewContextSelections };
