"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

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
import { DiagnosticBadge } from "@/features/ibm-pa/components/diagnostic-badge";
import { FavoriteToggle } from "@/features/ibm-pa/components/favorite-toggle";
import { FavoritesPanel } from "@/features/ibm-pa/components/favorites-panel";
import { RecentCubesPanel } from "@/features/ibm-pa/components/recent-cubes-panel";
import { deriveCubeDiagnostics } from "@/features/ibm-pa/lib/diagnostics";
import { getCubeSemanticDescriptor } from "@/features/ibm-pa/lib/semantic";
import { getCubeWorkspaceHref } from "@/features/ibm-pa/lib/cube-workspace-url-state";
import { cn } from "@/shared/lib/utils";
import type { CubeAccessibilityDiagnostic } from "@/shared/types/ibm-pa";

type CubeExplorerProps = {
  businessFlowId?: string | undefined;
  contextSidebar?: ReactNode;
  initialCubeName?: string | undefined;
  initialCubes: CubeAccessibilityDiagnostic[];
  initialSearchTerm?: string | undefined;
  serverName: string;
};

const cubesPerPage = 10;

const CubeExplorer = ({
  businessFlowId,
  contextSidebar,
  initialCubeName,
  initialCubes,
  initialSearchTerm,
  serverName,
}: CubeExplorerProps): ReactNode => {
  const cubeDiagnostics = initialCubes;
  const [cubeSearchTerm, setCubeSearchTerm] = useState(initialSearchTerm ?? "");
  const [cubePage, setCubePage] = useState(1);
  const selectedCube = useMemo(() => {
    return (
      cubeDiagnostics.find((cube) => cube.name === initialCubeName) ?? null
    );
  }, [cubeDiagnostics, initialCubeName]);

  const accessibleCubeCount = cubeDiagnostics.filter(
    (cube) => cube.reachable,
  ).length;
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
    <div className="min-w-0 overflow-hidden xl:h-[calc(100vh-8rem)] xl:min-h-0">
      <div className="grid min-w-0 gap-6 xl:h-full xl:min-h-0 xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
        {contextSidebar ? (
          <aside className="min-w-0 xl:h-full xl:min-h-0 xl:overflow-y-auto">
            <div className="space-y-4 pr-1">{contextSidebar}</div>
          </aside>
        ) : null}

        <section className="flex min-w-0 flex-col gap-4 xl:h-full xl:min-h-0">
          <div className="rounded-[1.25rem] border border-slate-200/80 bg-white/90 px-4 py-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
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

              <div className="flex flex-wrap gap-2 text-sm">
                <SummaryChip
                  label="Discovered"
                  value={cubeDiagnostics.length.toString()}
                />
                <SummaryChip
                  label="Accessible"
                  value={accessibleCubeCount.toString()}
                />
                <SummaryChip
                  label="Visible"
                  value={filteredCubes.length.toString()}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 text-sm text-slate-600">
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
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-24 text-center text-sm font-medium text-slate-700">
                  Page {safeCubePage} of {totalCubePages}
                </span>
                <Button
                  disabled={safeCubePage <= 1}
                  onClick={() => {
                    setCubePage((currentValue) =>
                      Math.max(currentValue - 1, 1),
                    );
                  }}
                  size="lg"
                  type="button"
                  variant="secondary"
                >
                  Previous
                </Button>
                <Button
                  disabled={safeCubePage >= totalCubePages}
                  onClick={() => {
                    setCubePage((currentValue) =>
                      Math.min(currentValue + 1, totalCubePages),
                    );
                  }}
                  size="lg"
                  type="button"
                  variant="secondary"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          <Card className="min-h-0 min-w-0 flex flex-1 flex-col overflow-hidden border-slate-200/80 bg-white/90">
            <CardHeader className="space-y-2 pb-4">
              <CardTitle className="text-lg">Cubes</CardTitle>
              <CardDescription>
                Accessible cubes open a workspace. Visible-only cubes remain
                available for qualification and access review.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 min-w-0 flex-1 overflow-y-auto">
              {paginatedCubes.length === 0 ? (
                <EmptyState
                  description="No cubes match the current search."
                  title="No visible cubes"
                />
              ) : (
                <div className="grid min-w-0 gap-4 xl:grid-cols-2">
                  {paginatedCubes.map((cube) => (
                    <CubeBrowserCard
                      cube={cube}
                      href={getCubeHref({
                        cubeName: cube.name,
                        flowId: businessFlowId,
                        searchTerm: cubeSearchTerm,
                        serverName,
                      })}
                      key={cube.name}
                      selected={cube.name === selectedCube?.name}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="min-w-0 xl:h-full xl:min-h-0 xl:overflow-y-auto">
          <div className="space-y-4 pl-1">
            <Card className="border-dashed border-slate-300 bg-slate-50/80">
              <CardHeader className="space-y-2 pb-4">
                <CardTitle className="text-lg">Workspace entry</CardTitle>
                <CardDescription>
                  Keep browsing in the center, while this rail tracks your
                  current workspace context.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                {selectedCube ? (
                  <div className="space-y-3 rounded-[1.25rem] border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Last opened cube
                    </p>
                    <p className="text-base font-semibold text-slate-950">
                      {getCubeSemanticDescriptor(selectedCube).displayLabel}
                    </p>
                    <DetailRow
                      label="Technical name"
                      value={selectedCube.name}
                    />
                    <DetailRow label="Server" value={selectedCube.serverName} />
                    <DetailRow
                      label="Workspace"
                      value={
                        selectedCube.reachable ? "Available" : "Unavailable"
                      }
                    />
                  </div>
                ) : null}

                <div className="space-y-3 rounded-[1.25rem] border border-slate-200 bg-white p-4">
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

            <FavoritesPanel currentServerName={serverName} />
            <RecentCubesPanel currentServerName={serverName} />
          </div>
        </aside>
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
      <MetadataRow label="Data update" value={cube.lastDataUpdate ?? "N/A"} />
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
  const diagnostics = deriveCubeDiagnostics({
    cube,
  });

  return (
    <Card
      className={cn(
        "min-w-0 border transition-colors",
        cube.reachable
          ? "border-slate-200 bg-white shadow-sm hover:border-slate-300"
          : "border-slate-200 bg-slate-100/70 text-slate-500",
        selected && cube.reachable
          ? "border-emerald-400 ring-2 ring-emerald-100"
          : "",
      )}
    >
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-4">
          {cube.reachable ? (
            <Link
              className="block min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={href}
            >
              <div className="space-y-2">
                <p className="truncate text-sm font-semibold leading-6 text-slate-950">
                  {semantic.displayLabel}
                </p>
                <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-500">
                  {semantic.technicalName}
                </p>
                <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                  {semantic.description}
                </p>
              </div>
            </Link>
          ) : (
            <div className="min-w-0 flex-1 space-y-2">
              <p className="truncate text-sm font-semibold leading-6 text-slate-950">
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
        <div className="flex flex-wrap gap-2">
          <DiagnosticBadge status={diagnostics.accessStatus} />
          <DiagnosticBadge status={diagnostics.metadataRichnessStatus} />
          <DiagnosticBadge status={diagnostics.manualEnrichmentStatus} />
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
  flowId?: string | undefined;
  searchTerm: string;
  serverName: string;
}): string => {
  const trimmedSearchTerm = params.searchTerm.trim();

  return getCubeWorkspaceHref({
    businessFlowId: params.flowId,
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
