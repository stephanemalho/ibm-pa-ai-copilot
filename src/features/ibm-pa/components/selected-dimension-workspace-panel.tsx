"use client";

import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AccessStatusBadge } from "@/features/ibm-pa/components/access-status-badge";
import type {
  CubeAccessibilityDiagnostic,
  DimensionAccessibilityDiagnostic,
} from "@/shared/types/ibm-pa";

type DimensionDetailState =
  | {
      status: "idle";
    }
  | {
      status: "loading";
    }
  | {
      message: string;
      status: "error";
    }
  | {
      dimension: DimensionAccessibilityDiagnostic;
      status: "success";
    };

type SelectedDimensionWorkspacePanelProps = {
  cube: CubeAccessibilityDiagnostic;
  detailState: DimensionDetailState;
  selectedDimensionName: string | null;
};

const SelectedDimensionWorkspacePanel = ({
  cube,
  detailState,
  selectedDimensionName,
}: SelectedDimensionWorkspacePanelProps): ReactNode => {
  return (
    <Card className="border-slate-200/80 bg-white/95 shadow-none xl:sticky xl:top-24">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            Dimension detail
          </span>
          {detailState.status === "success" ? (
            <AccessStatusBadge
              classification={detailState.dimension.classification}
              reachable={detailState.dimension.reachable}
            />
          ) : null}
        </div>

        <div className="space-y-2">
          <CardTitle className="text-xl">
            {selectedDimensionName ?? "Select a dimension"}
          </CardTitle>
          <CardDescription className="leading-6">
            Inspect one structural dimension at a time without expanding the
            whole cube schema.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {renderPanelContent({
          cube,
          detailState,
          selectedDimensionName,
        })}
      </CardContent>
    </Card>
  );
};

const renderPanelContent = (params: {
  cube: CubeAccessibilityDiagnostic;
  detailState: DimensionDetailState;
  selectedDimensionName: string | null;
}): ReactNode => {
  if (params.detailState.status === "idle") {
    return (
      <EmptyState
        description="Choose an accessible dimension from the structure table to load its hierarchy and member preview."
        title="No dimension selected"
      />
    );
  }

  if (params.detailState.status === "loading") {
    return <LoadingState />;
  }

  if (params.detailState.status === "error") {
    return (
      <ErrorState
        description={params.detailState.message}
        title="Dimension detail unavailable"
      />
    );
  }

  const { dimension } = params.detailState;

  if (!dimension.reachable) {
    return (
      <InaccessibleState
        cubeName={params.cube.name}
        dimension={dimension}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <Metric label="Hierarchy" value={dimension.hierarchyName ?? "Primary hierarchy"} />
        <Metric label="Visible sample members" value={dimension.members.length.toString()} />
        <Metric label="Cube" value={params.cube.name} />
        <Metric label="Server" value={params.cube.serverName} />
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-medium text-slate-900">Workspace summary</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This panel focuses on the currently selected dimension only, so the
          main workspace stays easy to scan even when the cube contains many
          dimensions.
        </p>
      </div>

      <section className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-950">
            Member preview
          </h3>
          <p className="text-sm leading-6 text-slate-600">
            Sample members returned by the existing metadata routes for this
            dimension.
          </p>
        </div>

        {dimension.members.length === 0 ? (
          <EmptyState
            description="No members were returned for this dimension."
            title="No members available"
          />
        ) : (
          <div className="max-h-[26rem] overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3">
            <div className="grid gap-2">
              {dimension.members.map((member) => (
                <div
                  className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800"
                  key={member}
                >
                  {member}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Diagnostics remain secondary in this workspace and are only surfaced
        when they help explain access or loading outcomes.
      </p>
    </div>
  );
};

const Metric = ({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactNode => {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
};

const LoadingState = (): ReactNode => {
  return (
    <div className="space-y-4">
      <div className="h-5 w-40 rounded-full bg-slate-200" />
      <div className="h-24 rounded-[1.5rem] bg-slate-100" />
      <div className="h-48 rounded-[1.5rem] bg-slate-100" />
    </div>
  );
};

const EmptyState = ({
  description,
  title,
}: {
  description: string;
  title: string;
}): ReactNode => {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6">
      <p className="font-medium text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
};

const ErrorState = ({
  description,
  title,
}: {
  description: string;
  title: string;
}): ReactNode => {
  return (
    <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-6">
      <p className="font-medium text-rose-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-rose-700">{description}</p>
    </div>
  );
};

const InaccessibleState = ({
  cubeName,
  dimension,
}: {
  cubeName: string;
  dimension: DimensionAccessibilityDiagnostic;
}): ReactNode => {
  return (
    <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        Access limited
      </p>
      <div className="space-y-2">
        <p className="text-base font-semibold text-slate-950">{dimension.name}</p>
        <p className="text-sm leading-6 text-slate-600">
          This dimension remains visible in <span className="font-medium">{cubeName}</span>
          , but its detailed metadata cannot be opened with the current access.
        </p>
      </div>
      <p className="text-sm leading-6 text-slate-500">{dimension.message}</p>
    </div>
  );
};

export { SelectedDimensionWorkspacePanel };
export type { DimensionDetailState };
