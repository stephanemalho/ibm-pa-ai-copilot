"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BusinessFlowContextBanner } from "@/features/ibm-pa/components/business-flow-context-banner";
import { ComparatorPanel } from "@/features/ibm-pa/components/comparator-panel";
import { CubeDimensionsTable } from "@/features/ibm-pa/components/cube-dimensions-table";
import { CubeWorkspaceHeader } from "@/features/ibm-pa/components/cube-workspace-header";
import { DataPreviewPanel } from "@/features/ibm-pa/components/data-preview-panel";
import { FavoriteToggle } from "@/features/ibm-pa/components/favorite-toggle";
import { SavedViewsPanel } from "@/features/ibm-pa/components/saved-views-panel";
import type {
  BusinessFlowDefinition,
  BusinessFlowPreviewDefaults,
} from "@/features/ibm-pa/lib/business-flows";
import {
  getCubeWorkspaceHref,
  parsePreviewContextSelections,
} from "@/features/ibm-pa/lib/cube-workspace-url-state";
import {
  dimensionDetailResponseSchema,
  routeErrorSchema,
} from "@/features/ibm-pa/lib/route-schemas";
import { useWorkspacePersistence } from "@/features/ibm-pa/lib/workspace-persistence";
import type {
  WorkspaceComparatorContextSelection,
  WorkspacePreviewContextSelection,
} from "@/features/ibm-pa/lib/workspace-state-types";
import {
  SelectedDimensionWorkspacePanel,
  type DimensionDetailState,
} from "@/features/ibm-pa/components/selected-dimension-workspace-panel";
import { appRoutes } from "@/shared/lib/routes";
import type {
  CubeAccessibilityDiagnostic,
  CubeDimensionStructureDiagnostic,
  DimensionAccessibilityDiagnostic,
} from "@/shared/types/ibm-pa";

type CubeWorkspaceProps = {
  businessFlow?: BusinessFlowDefinition | undefined;
  businessFlowPreviewDefaults?: BusinessFlowPreviewDefaults | undefined;
  cube: CubeAccessibilityDiagnostic;
  fromSearch?: string | undefined;
  initialDimensions: CubeDimensionStructureDiagnostic[];
  initialSelectedDimension?: DimensionAccessibilityDiagnostic | null | undefined;
};

const dimensionSampleSize = 24;

const CubeWorkspace = ({
  businessFlow,
  businessFlowPreviewDefaults,
  cube,
  fromSearch,
  initialDimensions,
  initialSelectedDimension,
}: CubeWorkspaceProps): ReactNode => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addRecentCube } = useWorkspacePersistence();
  const businessFlowId = searchParams.get("flow") ?? businessFlow?.id;
  const selectedDimensionFromUrl = searchParams.get("dimension");
  const comparatorRowDimensionFromUrl = searchParams.get("compareRow");
  const comparatorComparisonDimensionFromUrl = searchParams.get("compareDimension");
  const comparatorBaseMemberFromUrl = searchParams.get("compareBase");
  const comparatorCompareMemberFromUrl = searchParams.get("compareTarget");
  const comparatorContextSelectionsFromUrl = useMemo(() => {
    return parsePreviewContextSelections(searchParams.get("compareContext"));
  }, [searchParams]);
  const previewRowDimensionFromUrl = searchParams.get("previewRow");
  const previewContextSelectionsFromUrl = useMemo(() => {
    return parsePreviewContextSelections(searchParams.get("previewContext"));
  }, [searchParams]);
  const effectivePreviewContextSelections = useMemo(() => {
    if (previewContextSelectionsFromUrl.length > 0) {
      return previewContextSelectionsFromUrl;
    }

    return businessFlowPreviewDefaults?.previewContextSelections ?? [];
  }, [businessFlowPreviewDefaults, previewContextSelectionsFromUrl]);
  const effectivePreviewRowDimensionName =
    previewRowDimensionFromUrl ??
    businessFlowPreviewDefaults?.previewRowDimensionName;
  const defaultDimensionName = useMemo(() => {
    return initialDimensions.find((dimension) => dimension.reachable)?.name ?? null;
  }, [initialDimensions]);
  const selectedDimensionName =
    selectedDimensionFromUrl ??
    businessFlowPreviewDefaults?.selectedDimensionName ??
    defaultDimensionName;
  const [previewBuilderState, setPreviewBuilderState] = useState<{
    previewContextSelections: WorkspacePreviewContextSelection[];
    previewRowDimensionName?: string | undefined;
  }>({
    previewContextSelections: effectivePreviewContextSelections,
    ...(effectivePreviewRowDimensionName
      ? {
          previewRowDimensionName: effectivePreviewRowDimensionName,
        }
      : {}),
  });
  const [comparatorBuilderState, setComparatorBuilderState] = useState<{
    comparatorBaseMemberName?: string | undefined;
    comparatorCompareMemberName?: string | undefined;
    comparatorComparisonDimensionName?: string | undefined;
    comparatorContextSelections: WorkspaceComparatorContextSelection[];
    comparatorRowDimensionName?: string | undefined;
  }>({
    ...(comparatorBaseMemberFromUrl
      ? {
          comparatorBaseMemberName: comparatorBaseMemberFromUrl,
        }
      : {}),
    ...(comparatorCompareMemberFromUrl
      ? {
          comparatorCompareMemberName: comparatorCompareMemberFromUrl,
        }
      : {}),
    ...(comparatorComparisonDimensionFromUrl
      ? {
          comparatorComparisonDimensionName: comparatorComparisonDimensionFromUrl,
        }
      : {}),
    comparatorContextSelections: comparatorContextSelectionsFromUrl,
    ...(comparatorRowDimensionFromUrl
      ? {
          comparatorRowDimensionName: comparatorRowDimensionFromUrl,
        }
      : {}),
  });
  const handlePreviewStateChange = useCallback(
    (value: {
      previewContextSelections: WorkspacePreviewContextSelection[];
      previewRowDimensionName?: string | undefined;
    }) => {
      setPreviewBuilderState(value);
    },
    [],
  );
  const handleComparatorStateChange = useCallback(
    (value: {
      comparatorBaseMemberName?: string | undefined;
      comparatorCompareMemberName?: string | undefined;
      comparatorComparisonDimensionName?: string | undefined;
      comparatorContextSelections: WorkspaceComparatorContextSelection[];
      comparatorRowDimensionName?: string | undefined;
    }) => {
      setComparatorBuilderState(value);
    },
    [],
  );
  const selectedDimensionStructure = useMemo(() => {
    if (!selectedDimensionName) {
      return null;
    }

    return (
      initialDimensions.find((dimension) => dimension.name === selectedDimensionName) ??
      null
    );
  }, [initialDimensions, selectedDimensionName]);
  const [detailState, setDetailState] = useState<DimensionDetailState>(() => {
    if (
      initialSelectedDimension &&
      selectedDimensionName === initialSelectedDimension.name
    ) {
      return {
        dimension: initialSelectedDimension,
        status: "success",
      };
    }

    if (selectedDimensionName) {
      return {
        status: "loading",
      };
    }

    return {
      status: "idle",
    };
  });
  const effectiveDetailState = useMemo((): DimensionDetailState => {
    if (!selectedDimensionName) {
      return {
        status: "idle",
      };
    }

    if (!selectedDimensionStructure) {
      return {
        message: "The selected dimension does not belong to this cube.",
        status: "error",
      };
    }

    if (
      initialSelectedDimension &&
      initialSelectedDimension.name === selectedDimensionName
    ) {
      return {
        dimension: initialSelectedDimension,
        status: "success",
      };
    }

    if (detailState.status === "idle") {
      return {
        status: "loading",
      };
    }

    if (
      detailState.status === "success" &&
      detailState.dimension.name !== selectedDimensionName
    ) {
      return {
        status: "loading",
      };
    }

    return detailState;
  }, [
    detailState,
    initialSelectedDimension,
    selectedDimensionName,
    selectedDimensionStructure,
  ]);

  useEffect(() => {
    addRecentCube({
      cubeName: cube.name,
      serverName: cube.serverName,
    });
  }, [addRecentCube, cube.name, cube.serverName]);

  useEffect(() => {
    if (selectedDimensionFromUrl || !defaultDimensionName) {
      return;
    }

    router.replace(
      getCubeWorkspaceHref({
        businessFlowId,
        comparatorBaseMemberName: comparatorBaseMemberFromUrl ?? undefined,
        comparatorCompareMemberName: comparatorCompareMemberFromUrl ?? undefined,
        comparatorComparisonDimensionName:
          comparatorComparisonDimensionFromUrl ?? undefined,
        comparatorContextSelections:
          comparatorContextSelectionsFromUrl.length > 0
            ? comparatorContextSelectionsFromUrl
            : undefined,
        comparatorRowDimensionName: comparatorRowDimensionFromUrl ?? undefined,
        cubeName: cube.name,
        previewContextSelections:
          previewContextSelectionsFromUrl.length > 0
            ? previewContextSelectionsFromUrl
            : businessFlowPreviewDefaults?.previewContextSelections,
        previewRowDimensionName:
          previewRowDimensionFromUrl ??
          businessFlowPreviewDefaults?.previewRowDimensionName,
        selectedDimensionName: defaultDimensionName,
        fromSearch,
        serverName: cube.serverName,
      }),
      {
        scroll: false,
      },
    );
  }, [
    cube.name,
    cube.serverName,
    businessFlowId,
    businessFlowPreviewDefaults,
    comparatorBaseMemberFromUrl,
    comparatorCompareMemberFromUrl,
    comparatorComparisonDimensionFromUrl,
    comparatorContextSelectionsFromUrl,
    comparatorRowDimensionFromUrl,
    defaultDimensionName,
    fromSearch,
    previewContextSelectionsFromUrl,
    previewRowDimensionFromUrl,
    router,
    selectedDimensionFromUrl,
  ]);

  useEffect(() => {
    if (!selectedDimensionName || !selectedDimensionStructure) {
      return;
    }

    if (
      initialSelectedDimension &&
      initialSelectedDimension.name === selectedDimensionName
    ) {
      return;
    }

    let isActive = true;

    const loadDimensionDetail = async (): Promise<void> => {
      if (isActive) {
        setDetailState({
          status: "loading",
        });
      }

      try {
        const response = await fetch(
          `${appRoutes.ibmDimensionDetail}?cube=${encodeURIComponent(cube.name)}&dimension=${encodeURIComponent(selectedDimensionName)}&server=${encodeURIComponent(cube.serverName)}&sampleSize=${dimensionSampleSize}`,
          {
            cache: "no-store",
          },
        );
        const payload = (await response.json()) as unknown;

        if (!response.ok) {
          const parsedError = routeErrorSchema.safeParse(payload);

          if (!isActive) {
            return;
          }

          setDetailState({
            message: parsedError.success
              ? parsedError.data.error.message
              : "Unable to load the selected dimension.",
            status: "error",
          });
          return;
        }

        const parsedPayload = dimensionDetailResponseSchema.parse(payload);

        if (!isActive) {
          return;
        }

        setDetailState({
          dimension: parsedPayload.dimension,
          status: "success",
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setDetailState({
          message:
            error instanceof Error
              ? error.message
              : "Unable to load the selected dimension.",
          status: "error",
        });
      }
    };

    void loadDimensionDetail();

    return () => {
      isActive = false;
    };
  }, [
    cube.name,
    cube.serverName,
    initialSelectedDimension,
    selectedDimensionName,
    selectedDimensionStructure,
  ]);

  return (
    <div className="space-y-8">
      <CubeWorkspaceHeader
        actions={
          <FavoriteToggle
            className="border border-slate-200 shadow-sm"
            cubeName={cube.name}
            serverName={cube.serverName}
          />
        }
        businessFlowId={businessFlowId ?? undefined}
        cube={cube}
        dimensionCount={initialDimensions.length}
        fromSearch={fromSearch}
      />

      {businessFlow ? (
        <BusinessFlowContextBanner
          flow={businessFlow}
          previewDefaults={businessFlowPreviewDefaults}
          serverName={cube.serverName}
        />
      ) : null}

      <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(25rem,0.95fr)]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-950">
                Dimensions structure
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Scan the ordered cube structure in a compact table, then load
                one dimension at a time on the right.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <SummaryChip
                label="Total"
                value={initialDimensions.length.toString()}
              />
              <SummaryChip
                label="Accessible"
                value={initialDimensions
                  .filter((dimension) => dimension.reachable)
                  .length.toString()}
              />
            </div>
          </div>

          <CubeDimensionsTable
            dimensions={initialDimensions}
            onSelectDimension={(dimensionName) => {
              router.push(
                getCubeWorkspaceHref({
                  businessFlowId,
                  comparatorBaseMemberName:
                    comparatorBuilderState.comparatorBaseMemberName,
                  comparatorCompareMemberName:
                    comparatorBuilderState.comparatorCompareMemberName,
                  comparatorComparisonDimensionName:
                    comparatorBuilderState.comparatorComparisonDimensionName,
                  comparatorContextSelections:
                    comparatorBuilderState.comparatorContextSelections,
                  comparatorRowDimensionName:
                    comparatorBuilderState.comparatorRowDimensionName,
                  cubeName: cube.name,
                  previewContextSelections:
                    previewBuilderState.previewContextSelections,
                  previewRowDimensionName:
                    previewBuilderState.previewRowDimensionName,
                  selectedDimensionName: dimensionName,
                  fromSearch,
                  serverName: cube.serverName,
                }),
                {
                  scroll: false,
                },
              );
            }}
            selectedDimensionName={selectedDimensionName}
          />
        </div>

        <SelectedDimensionWorkspacePanel
          cube={cube}
          detailState={effectiveDetailState}
          selectedDimensionName={selectedDimensionName}
        />
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-950">
            Read-only data preview
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            Use the schema above to understand the cube, then build a guided
            preview to read live values without exposing raw query syntax.
          </p>
        </div>

        <DataPreviewPanel
          cubeName={cube.name}
          initialContextSelections={effectivePreviewContextSelections}
          initialRowDimensionName={effectivePreviewRowDimensionName ?? undefined}
          key={`${cube.serverName}:${cube.name}:${selectedDimensionName ?? "no-dimension"}:${previewRowDimensionFromUrl ?? "no-row"}:${searchParams.get("previewContext") ?? "no-context"}`}
          onStateChange={handlePreviewStateChange}
          selectedDimensionName={selectedDimensionName}
          serverName={cube.serverName}
        />
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-950">Comparator</h2>
          <p className="text-sm leading-6 text-slate-600">
            Build a read-only A versus B comparison by keeping one business
            dimension variable and the rest fixed as context.
          </p>
        </div>

        <ComparatorPanel
          cubeName={cube.name}
          initialBaseMemberName={comparatorBaseMemberFromUrl ?? undefined}
          initialCompareMemberName={comparatorCompareMemberFromUrl ?? undefined}
          initialComparisonDimensionName={
            comparatorComparisonDimensionFromUrl ?? undefined
          }
          initialContextSelections={comparatorContextSelectionsFromUrl}
          initialRowDimensionName={comparatorRowDimensionFromUrl ?? undefined}
          onStateChange={handleComparatorStateChange}
          selectedDimensionName={selectedDimensionName}
          serverName={cube.serverName}
        />
      </section>

      <SavedViewsPanel
        cubeName={cube.name}
        previewContextSelections={previewBuilderState.previewContextSelections}
        previewRowDimensionName={previewBuilderState.previewRowDimensionName}
        selectedDimensionName={selectedDimensionName ?? undefined}
        serverName={cube.serverName}
      />
    </div>
  );
};

const SummaryChip = ({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactNode => {
  return (
    <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
      <span className="font-semibold text-slate-950">{value}</span> {label}
    </div>
  );
};

export { CubeWorkspace };
