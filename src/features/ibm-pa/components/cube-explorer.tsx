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
import {
  cubeDimensionsResponseSchema,
  routeErrorSchema,
} from "@/features/ibm-pa/lib/route-schemas";
import { appRoutes } from "@/shared/lib/routes";
import type {
  CubeDimensionsResponse,
  CubeSummary,
} from "@/shared/types/ibm-pa";
import { cn } from "@/shared/lib/utils";

type CubeExplorerProps = {
  initialCubeName?: string | undefined;
  initialCubes: CubeSummary[];
  serverName: string;
};

type ExplorerState =
  | {
      status: "idle";
    }
  | {
      status: "loading";
    }
  | {
      data: CubeDimensionsResponse;
      status: "success";
    }
  | {
      message: string;
      status: "error";
    };

const CubeExplorer = ({
  initialCubeName,
  initialCubes,
  serverName,
}: CubeExplorerProps): ReactNode => {
  const [selectedCubeName, setSelectedCubeName] = useState<string | null>(
    initialCubeName ?? initialCubes[0]?.name ?? null,
  );
  const [requestNonce, setRequestNonce] = useState(0);
  const [explorerState, setExplorerState] = useState<ExplorerState>(
    selectedCubeName
      ? {
          status: "loading",
        }
      : {
          status: "idle",
        },
  );

  useEffect(() => {
    if (!selectedCubeName) {
      return;
    }

    let isActive = true;

    const loadCubeMetadata = async (): Promise<void> => {
      setExplorerState({
        status: "loading",
      });

      const requestUrl = `${appRoutes.ibmDimensions}?cube=${encodeURIComponent(selectedCubeName)}&server=${encodeURIComponent(serverName)}`;

      try {
        const response = await fetch(requestUrl, {
          cache: "no-store",
        });
        const payload = (await response.json()) as unknown;

        if (!response.ok) {
          const parsedError = routeErrorSchema.safeParse(payload);

          if (!isActive) {
            return;
          }

          setExplorerState({
            message: parsedError.success
              ? parsedError.data.error.message
              : "Unable to load cube metadata.",
            status: "error",
          });

          return;
        }

        const parsedPayload = cubeDimensionsResponseSchema.parse(payload);

        if (!isActive) {
          return;
        }

        setExplorerState({
          data: parsedPayload,
          status: "success",
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setExplorerState({
          message:
            error instanceof Error
              ? error.message
              : "Unable to load cube metadata.",
          status: "error",
        });
      }
    };

    void loadCubeMetadata();

    return () => {
      isActive = false;
    };
  }, [requestNonce, selectedCubeName, serverName]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.3fr_0.7fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Cubes</CardTitle>
          <CardDescription>
            Select a cube to inspect dimensions and sample members.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {initialCubes.length === 0 ? (
            <EmptyState
              description="No cubes were returned for this server."
              title="No cubes found"
            />
          ) : (
            initialCubes.map((cube) => (
              <button
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors",
                  cube.name === selectedCubeName
                    ? "border-primary bg-primary/5 text-slate-950"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100",
                )}
                key={cube.name}
                onClick={() => {
                  setSelectedCubeName(cube.name);
                }}
                type="button"
              >
                <span className="font-medium">{cube.name}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Cube
                </span>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {selectedCubeName
              ? `${selectedCubeName} metadata`
              : "Cube metadata"}
          </CardTitle>
          <CardDescription>
            Dimensions and sample members are loaded from the existing IBM
            metadata routes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderExplorerContent(explorerState, selectedCubeName, () => {
            setRequestNonce((currentValue) => currentValue + 1);
          })}
        </CardContent>
      </Card>
    </div>
  );
};

const renderExplorerContent = (
  state: ExplorerState,
  selectedCubeName: string | null,
  retry: () => void,
): ReactNode => {
  if (!selectedCubeName || state.status === "idle") {
    return (
      <EmptyState
        description="Choose a cube to inspect its dimensions and sample members."
        title="Select a cube"
      />
    );
  }

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <div className="h-5 w-48 rounded-full bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-40 rounded-2xl bg-slate-100" />
          <div className="h-40 rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5">
        <p className="text-sm font-medium text-rose-900">
          Unable to load metadata
        </p>
        <p className="text-sm leading-6 text-rose-700">{state.message}</p>
        <Button onClick={retry} type="button" variant="secondary">
          Retry
        </Button>
      </div>
    );
  }

  const { data } = state;

  if (data.dimensions.length === 0) {
    return (
      <EmptyState
        description="The cube responded, but no dimensions were returned."
        title="No dimensions found"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <SummaryChip
          label="Dimensions"
          value={data.dimensions.length.toString()}
        />
        <SummaryChip
          label="Member sets"
          value={data.members.length.toString()}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Dimensions
          </h3>
          {data.dimensions.map((dimension) => (
            <div
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              key={dimension.dimensionName}
            >
              <p className="font-medium text-slate-950">
                {dimension.dimensionName}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Hierarchy: {dimension.hierarchyName ?? "Primary hierarchy"}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Sample members
          </h3>
          {data.members.map((memberSet) => (
            <div
              className="rounded-2xl border border-slate-200 bg-white p-4"
              key={memberSet.dimensionName}
            >
              <p className="font-medium text-slate-950">
                {memberSet.dimensionName}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {memberSet.hierarchyName}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {memberSet.members.length === 0 ? (
                  <span className="text-sm text-slate-500">
                    No sample members returned.
                  </span>
                ) : (
                  memberSet.members.map((member) => (
                    <span
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                      key={member}
                    >
                      {member}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
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
