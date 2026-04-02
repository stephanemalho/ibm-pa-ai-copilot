"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCubeWorkspaceHref } from "@/features/ibm-pa/lib/cube-workspace-url-state";
import type { WorkspacePreviewContextSelection } from "@/features/ibm-pa/lib/workspace-state-types";
import { useWorkspacePersistence } from "@/features/ibm-pa/lib/workspace-persistence";

type SavedViewsPanelProps = {
  cubeName: string;
  previewContextSelections: WorkspacePreviewContextSelection[];
  previewRowDimensionName?: string | undefined;
  selectedDimensionName?: string | undefined;
  serverName: string;
};

const SavedViewsPanel = ({
  cubeName,
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
    <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Saved views
        </p>
        <p className="text-sm leading-6 text-slate-600">
          Save this workspace state so you can reopen the same dimension and
          preview setup later.
        </p>
      </div>

      <div className="space-y-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Save current view
          </span>
          <Input
            onChange={(event) => {
              setViewName(event.target.value);
            }}
            placeholder="Optional view name"
            value={viewName}
          />
        </label>

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
