"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCubeWorkspaceHref } from "@/features/ibm-pa/lib/cube-workspace-url-state";
import type { WorkspacePreviewContextSelection } from "@/features/ibm-pa/lib/workspace-state-types";
import { useWorkspacePersistence } from "@/features/ibm-pa/lib/workspace-persistence";

type SavedViewsPanelProps = {
  cubeName: string;
  defaultOpen?: boolean | undefined;
  previewContextSelections: WorkspacePreviewContextSelection[];
  previewRowDimensionName?: string | undefined;
  selectedDimensionName?: string | undefined;
  serverName: string;
};

const SavedViewsPanel = ({
  cubeName,
  defaultOpen = false,
  previewContextSelections,
  previewRowDimensionName,
  selectedDimensionName,
  serverName,
}: SavedViewsPanelProps): ReactNode => {
  const [viewName, setViewName] = useState("");
  const { removeSavedView, saveView, savedViews } = useWorkspacePersistence();
  const currentCubeSavedViews = useMemo(() => {
    return savedViews
      .filter(
        (savedView) =>
          savedView.cubeName === cubeName && savedView.serverName === serverName,
      )
      .sort((leftValue, rightValue) =>
        rightValue.createdAt.localeCompare(leftValue.createdAt),
      );
  }, [cubeName, savedViews, serverName]);

  return (
    <details
      className="group rounded-[1.5rem] border border-slate-200 bg-white/85"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950">Saved views</p>
          <p className="text-sm leading-6 text-slate-600">
            Save and reopen a useful workspace state when you need to come
            back to this cube.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
            {currentCubeSavedViews.length} saved
          </span>
          <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" />
        </div>
      </summary>

      <div className="space-y-4 border-t border-slate-200 px-5 py-4">
        <div className="space-y-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm leading-6 text-slate-600">
            Saved views restore the selected dimension and any guided preview
            context that is currently configured.
          </p>

          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              className="md:flex-1"
              onChange={(event) => {
                setViewName(event.target.value);
              }}
              placeholder="Optional view name"
              value={viewName}
            />

            <Button
              onClick={() => {
                saveView({
                  cubeName,
                  name: viewName,
                  previewContextSelections,
                  ...(previewRowDimensionName
                    ? {
                        previewRowDimensionName,
                      }
                    : {}),
                  ...(selectedDimensionName
                    ? {
                        selectedDimensionName,
                      }
                    : {}),
                  serverName,
                });
                setViewName("");
              }}
              type="button"
            >
              Save current view
            </Button>
          </div>
        </div>

        {currentCubeSavedViews.length === 0 ? (
          <EmptyState
            description="No saved views for this cube yet."
            title="No saved views"
          />
        ) : (
          <div className="space-y-2">
            {currentCubeSavedViews.map((savedView) => (
              <div
                className="flex items-start justify-between gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3"
                key={savedView.id}
              >
                <Link
                  className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={getCubeWorkspaceHref({
                    analysisPanel: "preview",
                    cubeName: savedView.cubeName,
                    previewContextSelections: savedView.previewContextSelections,
                    ...(savedView.previewRowDimensionName
                      ? {
                          previewRowDimensionName:
                            savedView.previewRowDimensionName,
                        }
                      : {}),
                    ...(savedView.selectedDimensionName
                      ? {
                          selectedDimensionName: savedView.selectedDimensionName,
                        }
                      : {}),
                    serverName: savedView.serverName,
                  })}
                >
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {savedView.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {getSavedViewSummary(savedView)}
                  </p>
                </Link>

                <button
                  className="rounded-full p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
                  onClick={() => {
                    removeSavedView(savedView.id);
                  }}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
};

const getSavedViewSummary = (savedView: {
  previewContextSelections: WorkspacePreviewContextSelection[];
  previewRowDimensionName?: string | undefined;
  selectedDimensionName?: string | undefined;
}): string => {
  const parts: string[] = [];

  if (savedView.selectedDimensionName) {
    parts.push(`Dimension: ${savedView.selectedDimensionName}`);
  }

  if (savedView.previewRowDimensionName) {
    parts.push(`Rows: ${savedView.previewRowDimensionName}`);
  }

  if (savedView.previewContextSelections.length > 0) {
    parts.push(`Filters: ${savedView.previewContextSelections.length}`);
  }

  if (parts.length === 0) {
    return "Workspace overview";
  }

  return parts.join(" | ");
};

const EmptyState = ({
  description,
  title,
}: {
  description: string;
  title: string;
}): ReactNode => {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-4">
      <p className="font-medium text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
};

export { SavedViewsPanel };
