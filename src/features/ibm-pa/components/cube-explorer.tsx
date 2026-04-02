"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AccessStatusBadge } from "@/features/ibm-pa/components/access-status-badge";
import { FavoriteToggle } from "@/features/ibm-pa/components/favorite-toggle";
import { FavoritesPanel } from "@/features/ibm-pa/components/favorites-panel";
import { RecentCubesPanel } from "@/features/ibm-pa/components/recent-cubes-panel";
import { cubeAccessibilityResponseSchema } from "@/features/ibm-pa/lib/route-schemas";
import { getCubeSemanticDescriptor } from "@/features/ibm-pa/lib/semantic";
import { getCubeWorkspaceHref } from "@/features/ibm-pa/lib/cube-workspace-url-state";
import { appRoutes } from "@/shared/lib/routes";
import { cn } from "@/shared/lib/utils";
import type { CubeAccessibilityDiagnostic } from "@/shared/types/ibm-pa";

type CubeExplorerProps = {
  initialCubeName?: string | undefined;
  initialCubes: CubeAccessibilityDiagnostic[];
  initialSearchTerm?: string | undefined;
  serverName: string;
};

const cubesPerPage = 10;

const CubeExplorer = ({
  initialCubeName,
  initialCubes,
  initialSearchTerm,
  serverName,
}: CubeExplorerProps): ReactNode => {
  const [cubeDiagnostics, setCubeDiagnostics] =
    useState<CubeAccessibilityDiagnostic[]>(initialCubes);
  const [cubeSearchTerm, setCubeSearchTerm] = useState(initialSearchTerm ?? "");
  const [cubePage, setCubePage] = useState(1);
  const [cubeRequestNonce, setCubeRequestNonce] = useState(0);
  const selectedCube = useMemo(() => {
    return (
      cubeDiagnostics.find((cube) => cube.name === initialCubeName) ?? null
    );
  }, [cubeDiagnostics, initialCubeName]);

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

  const accessibleCubeCount = cubeDiagnostics.filter((cube) => cube.reachable).length;
  const normalizedCubeSearchTerm = cubeSearchTerm.trim().toLowerCase();
  const filteredCubes = cubeDiagnostics.filter((cube) => {
    const semantic = getCubeSemanticDescriptor(cube);
    const searchableValue =
      `${semantic.displayLabel} ${semantic.technicalName} ${cube.uniqueName ?? ""}`.toLowerCase();

    return searchableValue.includes(normalizedCubeSearchTerm);
  });
  const totalCubePages =
    filteredCubes.length === 0
      ? 1
      : Math.ceil(filteredCubes.length / cubesPerPage);
  const safeCubePage = Math.min(cubePage, totalCubePages);
  const paginatedCubes = filteredCubes.slice(
    (safeCubePage - 1) * cubesPerPage,
    safeCubePage * cubesPerPage,
  );

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader>
          <CardTitle className="text-xl">Cube browser</CardTitle>
          <CardDescription>
            Browse the cube catalog for this TM1 server, then open a dedicated
            workspace for the cube you want to inspect.
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

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,0.9fr)]">
        <Card className="border-slate-200/80 bg-white/90">
          <CardHeader>
            <CardTitle className="text-xl">Cubes</CardTitle>
            <CardDescription>
              Accessible cubes open a dedicated schema workspace. Inaccessible
              cubes remain visible for access review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 xl:max-h-[42rem] xl:overflow-y-auto">
            {paginatedCubes.length === 0 ? (
              <EmptyState
                description="No cubes match the current search."
                title="No visible cubes"
              />
            ) : (
              paginatedCubes.map((cube) => (
                <CubeBrowserCard
                  cube={cube}
                  href={getCubeHref({
                    cubeName: cube.name,
                    searchTerm: cubeSearchTerm,
                    serverName,
                  })}
                  key={cube.name}
                  selected={cube.name === selectedCube?.name}
                />
              ))
            )}

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
            <CardTitle className="text-xl">Workspace entry</CardTitle>
            <CardDescription>
              Keep this page focused on browsing, then open a cube workspace for
              structure and dimension inspection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            {selectedCube ? (
              <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Last opened cube
                </p>
                <p className="text-lg font-semibold text-slate-950">
                  {getCubeSemanticDescriptor(selectedCube).displayLabel}
                </p>
                <DetailRow label="Technical name" value={selectedCube.name} />
                <DetailRow label="Server" value={selectedCube.serverName} />
                <DetailRow
                  label="Workspace"
                  value={selectedCube.reachable ? "Available" : "Unavailable"}
                />
              </div>
            ) : null}

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

            <FavoritesPanel currentServerName={serverName} />
            <RecentCubesPanel currentServerName={serverName} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const CubeMetadata = ({
  cube,
}: {
  cube: CubeAccessibilityDiagnostic;
}): ReactNode => {
  return (
    <div className="space-y-1.5">
      <MetadataRow label="Technical name" value={cube.name} />
      <MetadataRow label="Server" value={cube.serverName} />
      <MetadataRow
        label="Schema update"
        value={cube.lastSchemaUpdate ?? "N/A"}
      />
      <MetadataRow
        label="Data update"
        value={cube.lastDataUpdate ?? "N/A"}
      />
      <MetadataRow
        label="Semantic quality"
        value={getCubeSemanticDescriptor(cube).qualityLabel}
      />
      <MetadataRow
        label="Workspace"
        value={cube.reachable ? "Ready to open" : "Visible only"}
      />
    </div>
  );
};

const CubeBrowserCard = ({
  cube,
  href,
  selected,
}: {
  cube: CubeAccessibilityDiagnostic;
  href: string;
  selected: boolean;
}): ReactNode => {
  const semantic = getCubeSemanticDescriptor(cube);

  return (
    <Card
      className={cn(
        "border transition-colors",
        cube.reachable
          ? "border-slate-200 bg-white shadow-sm hover:border-slate-300"
          : "border-slate-200 bg-slate-100/70 text-slate-500",
        selected && cube.reachable
          ? "border-emerald-400 ring-2 ring-emerald-100"
          : "",
      )}
    >
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-start justify-between gap-4">
          {cube.reachable ? (
            <Link
              className="block min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={href}
            >
              <div className="space-y-2">
                <p className="truncate text-base font-semibold leading-6 text-slate-950">
                  {semantic.displayLabel}
                </p>
                <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-500">
                  {semantic.technicalName}
                </p>
                <p className="text-sm leading-6 text-slate-600">
                  {semantic.description}
                </p>
              </div>
            </Link>
          ) : (
            <div className="min-w-0 flex-1 space-y-2">
              <p className="truncate text-base font-semibold leading-6 text-slate-950">
                {semantic.displayLabel}
              </p>
              <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-500">
                {semantic.technicalName}
              </p>
              <p className="text-sm leading-6 text-slate-500">
                Cube visible, but unavailable
              </p>
            </div>
          )}

          <div className="flex shrink-0 items-start gap-2">
            <FavoriteToggle
              className="border border-slate-200 shadow-sm"
              cubeName={cube.name}
              serverName={cube.serverName}
            />
            <AccessStatusBadge
              classification={cube.classification}
              reachable={cube.reachable}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0 text-sm">
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {semantic.sourceLabel}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {semantic.qualityLabel}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {semantic.semanticKind}
          </span>
        </div>
        {cube.reachable ? (
          <Link
            className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={href}
          >
            <CubeMetadata cube={cube} />
          </Link>
        ) : (
          <>
            <CubeMetadata cube={cube} />
            {cube.message ? (
              <p className="text-xs leading-5 text-slate-500">{cube.message}</p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
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

const getCubeHref = (params: {
  cubeName: string;
  searchTerm: string;
  serverName: string;
}): string => {
  const trimmedSearchTerm = params.searchTerm.trim();

  return getCubeWorkspaceHref({
    cubeName: params.cubeName,
    ...(trimmedSearchTerm
      ? {
          fromSearch: trimmedSearchTerm,
        }
      : {}),
    serverName: params.serverName,
  });
};

export { CubeExplorer };
