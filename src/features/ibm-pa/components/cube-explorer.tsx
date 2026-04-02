"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AccessAwareCard } from "@/features/ibm-pa/components/access-aware-card";
import { SelectedDimensionPanel } from "@/features/ibm-pa/components/selected-dimension-panel";
import {
  cubeAccessibilityResponseSchema,
  dimensionAccessibilityResponseSchema,
  routeErrorSchema,
} from "@/features/ibm-pa/lib/route-schemas";
import { appRoutes } from "@/shared/lib/routes";
import type {
  CubeAccessibilityDiagnostic,
  DimensionAccessibilityDiagnostic,
} from "@/shared/types/ibm-pa";

type CubeExplorerProps = {
  initialCubeName?: string | undefined;
  initialCubes: CubeAccessibilityDiagnostic[];
  serverName: string;
};

type DimensionDiagnosticCache = Record<
  string,
  DimensionAccessibilityDiagnostic[]
>;

type DimensionExplorerState =
  | {
      status: "idle";
    }
  | {
      status: "loading";
    }
  | {
      dimensions: DimensionAccessibilityDiagnostic[];
      status: "success";
    }
  | {
      message: string;
      status: "error";
    };

const cubesPerPage = 10;
const dimensionSampleSize = 24;

const CubeExplorer = ({
  initialCubeName,
  initialCubes,
  serverName,
}: CubeExplorerProps): ReactNode => {
  const [cubeDiagnostics, setCubeDiagnostics] =
    useState<CubeAccessibilityDiagnostic[]>(initialCubes);
  const [dimensionCache, setDimensionCache] =
    useState<DimensionDiagnosticCache>({});
  const [cubeSearchTerm, setCubeSearchTerm] = useState("");
  const [cubePage, setCubePage] = useState(1);
  const [selectedCubeName, setSelectedCubeName] = useState<string | null>(
    initialCubeName ?? null,
  );
  const [selectedDimensionName, setSelectedDimensionName] = useState<
    string | null
  >(null);
  const [dimensionState, setDimensionState] = useState<DimensionExplorerState>(
    initialCubeName
      ? {
          status: "loading",
        }
      : {
          status: "idle",
        },
  );
  const [cubeRequestNonce, setCubeRequestNonce] = useState(0);
  const [dimensionRequestNonce, setDimensionRequestNonce] = useState(0);

  useEffect(() => {
    if (cubeRequestNonce === 0) {
      return;
    }

    let isActive = true;

    const loadCubeDiagnostics = async (): Promise<void> => {
      try {
        const response = await fetch(
          `${appRoutes.ibmCubeAccess}?server=${encodeURIComponent(serverName)}`,
          {
            cache: "no-store",
          },
        );
        const payload = (await response.json()) as unknown;

        if (!response.ok) {
          return;
        }

        const parsedPayload = cubeAccessibilityResponseSchema.parse(payload);

        if (!isActive) {
          return;
        }

        setCubeDiagnostics(parsedPayload.cubes);
        setSelectedCubeName((currentValue) => {
          if (
            currentValue &&
            parsedPayload.cubes.some((cube) => cube.name === currentValue)
          ) {
            return currentValue;
          }

          return null;
        });
        setSelectedDimensionName(null);
        setDimensionState({
          status: "idle",
        });
      } catch {
        if (!isActive) {
          return;
        }
      }
    };

    void loadCubeDiagnostics();

    return () => {
      isActive = false;
    };
  }, [cubeRequestNonce, serverName]);

  useEffect(() => {
    if (!selectedCubeName) {
      return;
    }

    let isActive = true;

    const loadDimensionDiagnostics = async (): Promise<void> => {
      setDimensionState({
        status: "loading",
      });

      try {
        const response = await fetch(
          `${appRoutes.ibmDimensionAccess}?cube=${encodeURIComponent(selectedCubeName)}&server=${encodeURIComponent(serverName)}&sampleSize=${dimensionSampleSize}`,
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

          setDimensionState({
            message: parsedError.success
              ? parsedError.data.error.message
              : "Unable to load dimension diagnostics.",
            status: "error",
          });

          return;
        }

        const parsedPayload =
          dimensionAccessibilityResponseSchema.parse(payload);

        if (!isActive) {
          return;
        }

        setDimensionState({
          dimensions: parsedPayload.dimensions,
          status: "success",
        });
        setDimensionCache((currentValue) => ({
          ...currentValue,
          [selectedCubeName]: parsedPayload.dimensions,
        }));

        setSelectedDimensionName((currentValue) => {
          if (
            currentValue &&
            parsedPayload.dimensions.some(
              (dimension) =>
                dimension.name === currentValue && dimension.reachable,
            )
          ) {
            return currentValue;
          }

          return null;
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setDimensionState({
          message:
            error instanceof Error
              ? error.message
              : "Unable to load dimension diagnostics.",
          status: "error",
        });
      }
    };

    void loadDimensionDiagnostics();

    return () => {
      isActive = false;
    };
  }, [dimensionRequestNonce, selectedCubeName, serverName]);

  const accessibleCubeCount = cubeDiagnostics.filter(
    (cube) => cube.reachable,
  ).length;
  const normalizedCubeSearchTerm = cubeSearchTerm.trim().toLowerCase();
  const filteredCubes = cubeDiagnostics.filter((cube) =>
    cube.name.toLowerCase().includes(normalizedCubeSearchTerm),
  );
  const totalCubePages =
    filteredCubes.length === 0
      ? 1
      : Math.ceil(filteredCubes.length / cubesPerPage);
  const safeCubePage = Math.min(cubePage, totalCubePages);
  const paginatedCubes = filteredCubes.slice(
    (safeCubePage - 1) * cubesPerPage,
    safeCubePage * cubesPerPage,
  );
  const selectedCubeVisibleInFilter = selectedCubeName
    ? filteredCubes.some((cube) => cube.name === selectedCubeName)
    : false;
  const selectedCube =
    cubeDiagnostics.find((cube) => cube.name === selectedCubeName) ?? null;
  const dimensions =
    dimensionState.status === "success" ? dimensionState.dimensions : [];
  const accessibleDimensionCount = dimensions.filter(
    (dimension) => dimension.reachable,
  ).length;
  const selectedDimension =
    dimensions.find((dimension) => dimension.name === selectedDimensionName) ??
    null;

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader>
          <CardTitle className="text-xl">Cube explorer</CardTitle>
          <CardDescription>
            Start with the cube catalog for this TM1 server. Dimensions and
            member details appear only after you select a cube.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="cube-search"
              >
                Search cubes
              </label>
              <Input
                id="cube-search"
                onChange={(event) => {
                  setCubeSearchTerm(event.target.value);
                  setCubePage(1);
                }}
                placeholder="Filter cubes by name"
                value={cubeSearchTerm}
              />
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <SummaryChip
                label="Discovered cubes"
                value={cubeDiagnostics.length.toString()}
              />
              <SummaryChip
                label="Accessible cubes"
                value={accessibleCubeCount.toString()}
              />
              <SummaryChip
                label="Visible results"
                value={filteredCubes.length.toString()}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600">
            <p>
              Showing{" "}
              <span className="font-medium text-slate-950">
                {filteredCubes.length === 0
                  ? 0
                  : (safeCubePage - 1) * cubesPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-950">
                {Math.min(safeCubePage * cubesPerPage, filteredCubes.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-950">
                {filteredCubes.length}
              </span>{" "}
              cubes
            </p>

            <div className="flex items-center gap-2">
              <Button
                disabled={safeCubePage <= 1}
                onClick={() => {
                  setCubePage((currentValue) => Math.max(currentValue - 1, 1));
                }}
                type="button"
                variant="secondary"
              >
                Previous
              </Button>
              <span className="min-w-24 text-center text-sm font-medium text-slate-700">
                Page {safeCubePage} of {totalCubePages}
              </span>
              <Button
                disabled={safeCubePage >= totalCubePages}
                onClick={() => {
                  setCubePage((currentValue) =>
                    Math.min(currentValue + 1, totalCubePages),
                  );
                }}
                type="button"
                variant="secondary"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedCube ? (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,0.85fr)]">
          <Card className="border-slate-200/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-xl">Cubes</CardTitle>
              <CardDescription>
                Accessible cubes are highlighted in green and can be opened for
                deeper exploration. Inaccessible cubes remain visible for access
                review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 xl:max-h-[42rem] xl:overflow-y-auto">
              {renderCubeList({
                cubes: paginatedCubes,
                dimensionCache,
                selectedCubeName,
                setSelectedCubeName,
                setSelectedDimensionName,
              })}
              <Button
                onClick={() => {
                  setCubeRequestNonce((currentValue) => currentValue + 1);
                }}
                type="button"
                variant="secondary"
              >
                Refresh cube access
              </Button>
            </CardContent>
          </Card>

          <Card className="border-dashed border-slate-300 bg-slate-50/80 xl:sticky xl:top-24">
            <CardHeader>
              <CardTitle className="text-xl">Select a cube</CardTitle>
              <CardDescription>
                Choose an accessible cube to reveal its dimensions and read-only
                metadata details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <p>
                The explorer stays cube-first by default so browsing remains
                focused and readable.
              </p>
              <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <DetailRow
                  label="Filtered cubes"
                  value={filteredCubes.length.toString()}
                />
                <DetailRow
                  label="Accessible in results"
                  value={filteredCubes
                    .filter((cube) => cube.reachable)
                    .length.toString()}
                />
                <DetailRow label="Server" value={serverName} />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1.05fr)_minmax(26rem,1.05fr)]">
          <Card className="border-slate-200/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-xl">Cubes</CardTitle>
              <CardDescription>
                Filter and browse the cube catalog. Your current selection stays
                active while you refine the visible list.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 xl:max-h-[42rem] xl:overflow-y-auto">
              {!selectedCubeVisibleInFilter ? (
                <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  The selected cube is outside the current filter. Clear or
                  adjust the search to show it again in the list.
                </div>
              ) : null}
              {renderCubeList({
                cubes: paginatedCubes,
                dimensionCache,
                selectedCubeName,
                setSelectedCubeName,
                setSelectedDimensionName,
              })}
              <Button
                onClick={() => {
                  setCubeRequestNonce((currentValue) => currentValue + 1);
                }}
                type="button"
                variant="secondary"
              >
                Refresh cube access
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-xl">
                {selectedCubeName} dimensions
              </CardTitle>
              <CardDescription>
                Dimensions are loaded only for the selected cube and remain
                access-aware for read-only exploration.
              </CardDescription>
            </CardHeader>
            <CardContent className="xl:max-h-[42rem] xl:overflow-y-auto">
              {renderDimensionList({
                dimensionState,
                onRetry: () => {
                  setDimensionRequestNonce((currentValue) => currentValue + 1);
                },
                selectedCubeName,
                selectedDimension,
                setSelectedDimensionName,
              })}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/90 xl:sticky xl:top-24">
            <CardHeader>
              <CardTitle className="text-xl">Details</CardTitle>
              <CardDescription>
                Review the selected dimension and browse its members without
                leaving the current server context.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SelectedDimensionPanel
                accessibleDimensionCount={accessibleDimensionCount}
                dimensionCount={dimensions.length}
                dimensionStatus={dimensionState.status}
                selectedCube={selectedCube}
                selectedDimension={selectedDimension}
                key={selectedDimension?.name ?? "dimension-placeholder"}
                {...(dimensionState.status === "error"
                  ? {
                      dimensionErrorMessage: dimensionState.message,
                    }
                  : {})}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const renderCubeList = (params: {
  cubes: CubeAccessibilityDiagnostic[];
  dimensionCache: DimensionDiagnosticCache;
  selectedCubeName: string | null;
  setSelectedCubeName: (value: string | null) => void;
  setSelectedDimensionName: (value: string | null) => void;
}): ReactNode => {
  if (params.cubes.length === 0) {
    return (
      <EmptyState
        description="No cubes match the current search."
        title="No visible cubes"
      />
    );
  }

  return params.cubes.map((cube) => (
    <AccessAwareCard
      accessible={cube.reachable}
      classification={cube.classification}
      key={cube.name}
      message={!cube.reachable ? cube.message : undefined}
      metadata={
        <CubeMetadata
          cube={cube}
          dimensionCount={params.dimensionCache[cube.name]?.length}
        />
      }
      onClick={
        cube.reachable
          ? () => {
              params.setSelectedCubeName(cube.name);
              params.setSelectedDimensionName(null);
            }
          : undefined
      }
      selected={cube.reachable && cube.name === params.selectedCubeName}
      subtitle={getCubeSubtitle(cube)}
      title={cube.name}
    />
  ));
};

const renderDimensionList = (params: {
  dimensionState: DimensionExplorerState;
  onRetry: () => void;
  selectedCubeName: string | null;
  selectedDimension: DimensionAccessibilityDiagnostic | null;
  setSelectedDimensionName: (value: string) => void;
}): ReactNode => {
  if (!params.selectedCubeName || params.dimensionState.status === "idle") {
    return (
      <EmptyState
        description="Select a cube to inspect its dimensions."
        title="No dimensions yet"
      />
    );
  }

  if (params.dimensionState.status === "loading") {
    return (
      <div className="space-y-4">
        <div className="h-5 w-40 rounded-full bg-slate-200" />
        <div className="h-28 rounded-2xl bg-slate-100" />
        <div className="h-28 rounded-2xl bg-slate-100" />
        <div className="h-28 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (params.dimensionState.status === "error") {
    return (
      <div className="space-y-4 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5">
        <p className="text-sm font-medium text-rose-900">
          Unable to load dimension diagnostics
        </p>
        <p className="text-sm leading-6 text-rose-700">
          {params.dimensionState.message}
        </p>
        <Button onClick={params.onRetry} type="button" variant="secondary">
          Retry
        </Button>
      </div>
    );
  }

  const { dimensions } = params.dimensionState;

  if (dimensions.length === 0) {
    return (
      <EmptyState
        description="No dimensions were returned for this cube."
        title="No dimensions found"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <SummaryChip
          label="Discovered dimensions"
          value={dimensions.length.toString()}
        />
        <SummaryChip
          label="Accessible dimensions"
          value={dimensions
            .filter((dimension) => dimension.reachable)
            .length.toString()}
        />
      </div>

      <div className="space-y-3">
        {dimensions.map((dimension) => (
          <AccessAwareCard
            accessible={dimension.reachable}
            classification={dimension.classification}
            key={dimension.name}
            message={!dimension.reachable ? dimension.message : undefined}
            metadata={<DimensionMetadata dimension={dimension} />}
            onClick={
              dimension.reachable
                ? () => {
                    params.setSelectedDimensionName(dimension.name);
                  }
                : undefined
            }
            selected={
              dimension.reachable &&
              dimension.name === params.selectedDimension?.name
            }
            subtitle={getDimensionSubtitle(dimension)}
            title={dimension.name}
          />
        ))}
      </div>
    </div>
  );
};

const CubeMetadata = ({
  cube,
  dimensionCount,
}: {
  cube: CubeAccessibilityDiagnostic;
  dimensionCount?: number | undefined;
}): ReactNode => {
  return (
    <div className="space-y-1.5">
      <MetadataRow label="Server" value={cube.serverName} />
      <MetadataRow
        label="Explorer status"
        value={cube.reachable ? "Ready for dimensions" : "Visible only"}
      />
      <MetadataRow
        label="Dimensions"
        value={dimensionCount?.toString() ?? "Load to inspect"}
      />
    </div>
  );
};

const DimensionMetadata = ({
  dimension,
}: {
  dimension: DimensionAccessibilityDiagnostic;
}): ReactNode => {
  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <MetadataRow
          label="Hierarchy"
          value={dimension.hierarchyName ?? "Primary hierarchy"}
        />
        <MetadataRow
          label="Sample members"
          value={dimension.members.length.toString()}
        />
      </div>

      {dimension.members.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {dimension.members.slice(0, 3).map((member) => (
            <span
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
              key={member}
            >
              {member}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const MetadataRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactNode => {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactNode => {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
};

const getCubeSubtitle = (cube: CubeAccessibilityDiagnostic): string => {
  return cube.reachable
    ? "Cube metadata available"
    : "Cube visible, but unavailable";
};

const getDimensionSubtitle = (
  dimension: DimensionAccessibilityDiagnostic,
): string => {
  return dimension.reachable
    ? "Dimension metadata available"
    : "Dimension visible, but unavailable";
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

export { CubeExplorer };
