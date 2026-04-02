"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { AccessStatusBadge } from "@/features/ibm-pa/components/access-status-badge";
import { getServerRoute } from "@/shared/lib/routes";
import type { CubeAccessibilityDiagnostic } from "@/shared/types/ibm-pa";

type CubeWorkspaceHeaderProps = {
  actions?: ReactNode;
  cube: CubeAccessibilityDiagnostic;
  dimensionCount: number;
  fromSearch?: string | undefined;
};

const CubeWorkspaceHeader = ({
  actions,
  cube,
  dimensionCount,
  fromSearch,
}: CubeWorkspaceHeaderProps): ReactNode => {
  const backHref = getServerBackHref(cube.serverName, cube.name, fromSearch);

  return (
    <section className="space-y-5 rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-panel backdrop-blur xl:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button asChild variant="ghost">
          <Link href={backHref}>Back to cube browser</Link>
        </Button>

        <div className="flex flex-wrap items-center gap-3">
          {actions}
          <AccessStatusBadge
            classification={cube.classification}
            reachable={cube.reachable}
          />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            Cube workspace
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.8fr)]">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            {cube.serverName}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            {cube.name}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-600">
            {getHeaderSummary({
              cubeName: cube.name,
              dimensionCount,
              reachable: cube.reachable,
            })}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <SummaryBlock
            label="Server"
            value={cube.serverName}
          />
          <SummaryBlock
            label="Dimensions"
            value={dimensionCount.toString()}
          />
        </div>
      </div>
    </section>
  );
};

const SummaryBlock = ({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactNode => {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
};

const getServerBackHref = (
  serverName: string,
  cubeName: string,
  fromSearch?: string | undefined,
): string => {
  const searchParams = new URLSearchParams({
    cube: cubeName,
  });

  if (fromSearch) {
    searchParams.set("q", fromSearch);
  }

  return `${getServerRoute(serverName)}?${searchParams.toString()}`;
};

const getHeaderSummary = (params: {
  cubeName: string;
  dimensionCount: number;
  reachable: boolean;
}): string => {
  if (!params.reachable) {
    return `${params.cubeName} is visible in the catalog, but this account cannot currently open its structure workspace.`;
  }

  if (params.dimensionCount === 0) {
    return `${params.cubeName} is ready for inspection. No structural dimensions were returned yet for this workspace.`;
  }

  if (params.dimensionCount === 1) {
    return `${params.cubeName} currently exposes a single structural dimension, making this workspace straightforward to inspect.`;
  }

  return `${params.cubeName} is structured by ${params.dimensionCount} ordered dimensions. Use the workspace below to scan the structure and inspect one dimension at a time.`;
};

export { CubeWorkspaceHeader };
