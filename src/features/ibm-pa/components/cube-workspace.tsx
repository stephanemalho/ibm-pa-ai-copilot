"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AnalysisPanelSwitcher } from "@/features/ibm-pa/components/analysis-panel-switcher";
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
  type CubeWorkspaceAnalysisPanel,
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
  initialSelectedDimension?:
    | DimensionAccessibilityDiagnostic
    | null
    | undefined;
};

const dimensionSampleSize = 24;

type PreviewBuilderState = {
  previewContextSelections: WorkspacePreviewContextSelection[];
  previewRowDimensionName?: string | undefined;
};

type ComparatorBuilderState = {
  comparatorBaseMemberName?: string | undefined;
  comparatorCompareMemberName?: string | undefined;
  comparatorComparisonDimensionName?: string | undefined;
  comparatorContextSelections: WorkspaceComparatorContextSelection[];
  comparatorRowDimensionName?: string | undefined;
};

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
  const analysisPanelFromUrl = searchParams.get("panel");
  const selectedDimensionFromUrl = searchParams.get("dimension");
  const activeAnalysisPanel: CubeWorkspaceAnalysisPanel =
    analysisPanelFromUrl === "compare" ? "compare" : "preview";
  const comparatorRowDimensionFromUrl = searchParams.get("compareRow");
  const comparatorComparisonDimensionFromUrl =
    searchParams.get("compareDimension");
  const comparatorBaseMemberFromUrl = searchParams.get("compareBase");
  const comparatorCompareMemberFromUrl = searchParams.get("compareTarget");
  const comparatorContextFromUrl = searchParams.get("compareContext");
  const comparatorContextSelectionsFromUrl = useMemo(() => {
    return parsePreviewContextSelections(comparatorContextFromUrl);
  }, [comparatorContextFromUrl]);
  const previewRowDimensionFromUrl = searchParams.get("previewRow");
  const previewContextFromUrl = searchParams.get("previewContext");
  const previewContextSelectionsFromUrl = useMemo(() => {
    return parsePreviewContextSelections(previewContextFromUrl);
  }, [previewContextFromUrl]);
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
    return (
      initialDimensions.find((dimension) => dimension.reachable)?.name ?? null
    );
  }, [initialDimensions]);
  const selectedDimensionName =
    selectedDimensionFromUrl ??
    businessFlowPreviewDefaults?.selectedDimensionName ??
    defaultDimensionName;
  const previewUrlState = useMemo<PreviewBuilderState>(() => {
    return {
      previewContextSelections: effectivePreviewContextSelections,
      ...(effectivePreviewRowDimensionName
        ? {
            previewRowDimensionName: effectivePreviewRowDimensionName,
          }
        : {}),
    };
  }, [effectivePreviewContextSelections, effectivePreviewRowDimensionName]);
  const comparatorUrlState = useMemo<ComparatorBuilderState>(() => {
    return {
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
            comparatorComparisonDimensionName:
              comparatorComparisonDimensionFromUrl,
          }
        : {}),
      comparatorContextSelections: comparatorContextSelectionsFromUrl,
      ...(comparatorRowDimensionFromUrl
        ? {
            comparatorRowDimensionName: comparatorRowDimensionFromUrl,
          }
        : {}),
    };
  }, [
    comparatorBaseMemberFromUrl,
    comparatorCompareMemberFromUrl,
    comparatorComparisonDimensionFromUrl,
    comparatorContextSelectionsFromUrl,
    comparatorRowDimensionFromUrl,
  ]);
  const previewStateSeed = useMemo(() => {
    return JSON.stringify(previewUrlState);
  }, [previewUrlState]);
  const comparatorStateSeed = useMemo(() => {
    return JSON.stringify(comparatorUrlState);
  }, [comparatorUrlState]);
  const [previewBuilderStateStore, setPreviewBuilderStateStore] = useState<{
    seed: string;
    value: PreviewBuilderState;
  }>(() => {
    return {
      seed: previewStateSeed,
      value: previewUrlState,
    };
  });
  const [comparatorBuilderStateStore, setComparatorBuilderStateStore] =
    useState<{
      seed: string;
      value: ComparatorBuilderState;
    }>(() => {
      return {
        seed: comparatorStateSeed,
        value: comparatorUrlState,
      };
    });
  const previewBuilderState =
    previewBuilderStateStore.seed === previewStateSeed
      ? previewBuilderStateStore.value
      : previewUrlState;
  const comparatorBuilderState =
    comparatorBuilderStateStore.seed === comparatorStateSeed
      ? comparatorBuilderStateStore.value
      : comparatorUrlState;
  const previewPanelKey = useMemo(() => {
    return [
      cube.serverName,
      cube.name,
      "preview",
      selectedDimensionName ?? "no-dimension",
      previewStateSeed,
    ].join(":");
  }, [cube.name, cube.serverName, previewStateSeed, selectedDimensionName]);
  const comparatorPanelKey = useMemo(() => {
    return [
      cube.serverName,
      cube.name,
      "compare",
      selectedDimensionName ?? "no-dimension",
      comparatorStateSeed,
    ].join(":");
  }, [comparatorStateSeed, cube.name, cube.serverName, selectedDimensionName]);
  const handlePreviewStateChange = useCallback(
    (value: PreviewBuilderState) => {
      setPreviewBuilderStateStore({
        seed: previewStateSeed,
        value,
      });
    },
    [previewStateSeed],
  );
  const handleComparatorStateChange = useCallback(
    (value: ComparatorBuilderState) => {
      setComparatorBuilderStateStore({
        seed: comparatorStateSeed,
        value,
      });
    },
    [comparatorStateSeed],
  );
  const getWorkspaceHref = useCallback(
    (overrides?: {
      analysisPanel?: CubeWorkspaceAnalysisPanel | undefined;
      selectedDimensionName?: string | undefined;
    }): string => {
      return getCubeWorkspaceHref({
        analysisPanel: overrides?.analysisPanel ?? activeAnalysisPanel,
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
        previewContextSelections: previewBuilderState.previewContextSelections,
        previewRowDimensionName: previewBuilderState.previewRowDimensionName,
        selectedDimensionName:
          overrides?.selectedDimensionName ??
          selectedDimensionName ??
          undefined,
        fromSearch,
        serverName: cube.serverName,
      });
    },
    [
      activeAnalysisPanel,
      businessFlowId,
      comparatorBuilderState,
      cube.name,
      cube.serverName,
      fromSearch,
      previewBuilderState.previewContextSelections,
      previewBuilderState.previewRowDimensionName,
      selectedDimensionName,
    ],
  );
  const selectedDimensionStructure = useMemo(() => {
    if (!selectedDimensionName) {
      return null;
    }

    return (
      initialDimensions.find(
        (dimension) => dimension.name === selectedDimensionName,
      ) ?? null
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
    const nextSelectedDimensionName =
      selectedDimensionFromUrl ?? defaultDimensionName;

    if (!nextSelectedDimensionName) {
      return;
    }

    if (
      selectedDimensionFromUrl &&
      (analysisPanelFromUrl === "preview" || analysisPanelFromUrl === "compare")
    ) {
      return;
    }

    router.replace(
      getCubeWorkspaceHref({
        analysisPanel: activeAnalysisPanel,
        businessFlowId,
        comparatorBaseMemberName: comparatorBaseMemberFromUrl ?? undefined,
        comparatorCompareMemberName:
          comparatorCompareMemberFromUrl ?? undefined,
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
        selectedDimensionName: nextSelectedDimensionName,
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
    activeAnalysisPanel,
    analysisPanelFromUrl,
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
        dimensions={initialDimensions}
        fromSearch={fromSearch}
        selectedDimension={
          effectiveDetailState.status === "success"
            ? effectiveDetailState.dimension
            : undefined
        }
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
                getWorkspaceHref({
                  selectedDimensionName: dimensionName,
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-950">Analysis</h2>
            <p className="text-sm leading-6 text-slate-600">
              Focus on one read-only analysis mode at a time so the workspace
              stays easier to scan and faster to navigate.
            </p>
          </div>

          <AnalysisPanelSwitcher
            activePanel={activeAnalysisPanel}
            onPanelChange={(panel) => {
              router.push(
                getWorkspaceHref({
                  analysisPanel: panel,
                }),
                {
                  scroll: false,
                },
              );
            }}
          />
        </div>

        {activeAnalysisPanel === "preview" ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Active panel
              </p>
              <h3 className="text-xl font-semibold text-slate-950">
                Read-only data preview
              </h3>
              <p className="text-sm leading-6 text-slate-600">
                Use the schema above to understand the cube, then build a guided
                preview to read live values without exposing raw query syntax.
              </p>
            </div>

            <DataPreviewPanel
              cubeName={cube.name}
              initialContextSelections={
                previewBuilderState.previewContextSelections
              }
              initialRowDimensionName={
                previewBuilderState.previewRowDimensionName
              }
              key={previewPanelKey}
              onStateChange={handlePreviewStateChange}
              selectedDimensionName={selectedDimensionName}
              serverName={cube.serverName}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Active panel
              </p>
              <h3 className="text-xl font-semibold text-slate-950">
                Comparator
              </h3>
              <p className="text-sm leading-6 text-slate-600">
                Build a read-only A versus B comparison by keeping one business
                dimension variable and the rest fixed as context.
              </p>
            </div>

            <ComparatorPanel
              cubeName={cube.name}
              initialBaseMemberName={
                comparatorBuilderState.comparatorBaseMemberName
              }
              initialCompareMemberName={
                comparatorBuilderState.comparatorCompareMemberName
              }
              initialComparisonDimensionName={
                comparatorBuilderState.comparatorComparisonDimensionName
              }
              initialContextSelections={
                comparatorBuilderState.comparatorContextSelections
              }
              initialRowDimensionName={
                comparatorBuilderState.comparatorRowDimensionName
              }
              key={comparatorPanelKey}
              onStateChange={handleComparatorStateChange}
              selectedDimensionName={selectedDimensionName}
              serverName={cube.serverName}
            />
          </div>
        )}
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
