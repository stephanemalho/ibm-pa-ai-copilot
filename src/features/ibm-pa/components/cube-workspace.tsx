"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { CubeDimensionsTable } from "@/features/ibm-pa/components/cube-dimensions-table";
import { CubeWorkspaceHeader } from "@/features/ibm-pa/components/cube-workspace-header";
import { DataPreviewPanel } from "@/features/ibm-pa/components/data-preview-panel";
import {
  dimensionDetailResponseSchema,
  routeErrorSchema,
} from "@/features/ibm-pa/lib/route-schemas";
import {
  SelectedDimensionWorkspacePanel,
  type DimensionDetailState,
} from "@/features/ibm-pa/components/selected-dimension-workspace-panel";
import { appRoutes, getCubeWorkspaceRoute } from "@/shared/lib/routes";
import type {
  CubeAccessibilityDiagnostic,
  CubeDimensionStructureDiagnostic,
  DimensionAccessibilityDiagnostic,
} from "@/shared/types/ibm-pa";

type CubeWorkspaceProps = {
  cube: CubeAccessibilityDiagnostic;
  fromSearch?: string | undefined;
  initialDimensions: CubeDimensionStructureDiagnostic[];
  initialSelectedDimension?: DimensionAccessibilityDiagnostic | null | undefined;
};

const dimensionSampleSize = 24;

const CubeWorkspace = ({
  cube,
  fromSearch,
  initialDimensions,
  initialSelectedDimension,
}: CubeWorkspaceProps): ReactNode => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDimensionFromUrl = searchParams.get("dimension");
  const defaultDimensionName = useMemo(() => {
    return initialDimensions.find((dimension) => dimension.reachable)?.name ?? null;
  }, [initialDimensions]);
  const selectedDimensionName = selectedDimensionFromUrl ?? defaultDimensionName;
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
    if (selectedDimensionFromUrl || !defaultDimensionName) {
      return;
    }

    router.replace(
      buildWorkspaceHref({
        cubeName: cube.name,
        dimensionName: defaultDimensionName,
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
    defaultDimensionName,
    fromSearch,
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
        cube={cube}
        dimensionCount={initialDimensions.length}
        fromSearch={fromSearch}
      />

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
                buildWorkspaceHref({
                  cubeName: cube.name,
                  dimensionName,
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
          key={`${cube.serverName}:${cube.name}:${selectedDimensionName ?? "no-dimension"}`}
          selectedDimensionName={selectedDimensionName}
          serverName={cube.serverName}
        />
      </section>
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

const buildWorkspaceHref = (params: {
  cubeName: string;
  dimensionName: string;
  fromSearch?: string | undefined;
  serverName: string;
}): string => {
  const search = new URLSearchParams({
    dimension: params.dimensionName,
  });

  if (params.fromSearch) {
    search.set("fromSearch", params.fromSearch);
  }

  return `${getCubeWorkspaceRoute(params.cubeName, params.serverName)}?${search.toString()}`;
};

export { CubeWorkspace };
