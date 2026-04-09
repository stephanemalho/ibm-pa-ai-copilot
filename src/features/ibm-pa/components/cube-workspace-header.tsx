"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { AccessStatusBadge } from "@/features/ibm-pa/components/access-status-badge";
import { DiagnosticBadge } from "@/features/ibm-pa/components/diagnostic-badge";
import { deriveCubeDiagnostics } from "@/features/ibm-pa/lib/diagnostics";
import { getCubeSemanticDescriptor } from "@/features/ibm-pa/lib/semantic";
import { getServerRoute } from "@/shared/lib/routes";
import type {
  CubeAccessibilityDiagnostic,
  CubeDimensionStructureDiagnostic,
  DimensionAccessibilityDiagnostic,
} from "@/shared/types/ibm-pa";

type CubeWorkspaceHeaderProps = {
  actions?: ReactNode;
  businessFlowId?: string | undefined;
  cube: CubeAccessibilityDiagnostic;
  dimensionCount: number;
  dimensions?: CubeDimensionStructureDiagnostic[] | undefined;
  fromSearch?: string | undefined;
  selectedDimension?: DimensionAccessibilityDiagnostic | null | undefined;
};

const CubeWorkspaceHeader = ({
  actions,
  businessFlowId,
  cube,
  dimensionCount,
  dimensions,
  fromSearch,
  selectedDimension,
}: CubeWorkspaceHeaderProps): ReactNode => {
  const backHref = getServerBackHref(
    cube.serverName,
    cube.name,
    fromSearch,
    businessFlowId,
  );
  const semantic = getCubeSemanticDescriptor(cube);
  const diagnostics = deriveCubeDiagnostics({
    cube,
    dimensions,
    selectedDimension,
  });

  return (
    <section className="space-y-5 rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-panel backdrop-blur xl:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button asChild variant="ghost">
          <Link href={backHref}>
            {businessFlowId ? "Back to guided cube browser" : "Back to cube browser"}
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-3">
          {actions}
          <AccessStatusBadge
            classification={cube.classification}
            reachable={cube.reachable}
          />
          <DiagnosticBadge status={diagnostics.previewReadinessStatus} />
          <DiagnosticBadge status={diagnostics.comparisonReadinessStatus} />
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
            {semantic.displayLabel}
          </h1>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            {semantic.technicalName}
          </p>
          <p className="max-w-3xl text-base leading-7 text-slate-600">
            {diagnostics.summaryMessage}
          </p>
          <p className="max-w-3xl text-sm leading-6 text-slate-500">
            {semantic.usageHint}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <SummaryBlock
            label="Preview readiness"
            value={diagnostics.previewReadinessStatus.label}
          />
          <SummaryBlock
            label="Comparison readiness"
            value={diagnostics.comparisonReadinessStatus.label}
          />
          <SummaryBlock
            label="Metadata richness"
            value={diagnostics.metadataRichnessStatus.label}
          />
          <SummaryBlock
            label="Semantic quality"
            value={diagnostics.semanticQualityStatus.label}
          />
          <SummaryBlock
            label="Dimension access"
            value={diagnostics.dimensionAccessStatus.label}
          />
          <SummaryBlock
            label="Dimensions"
            value={dimensionCount.toString()}
          />
          <SummaryBlock
            label="Update metadata"
            value={diagnostics.updateMetadataStatus.label}
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
  businessFlowId?: string | undefined,
): string => {
  const searchParams = new URLSearchParams({
    cube: cubeName,
  });

  if (businessFlowId) {
    searchParams.set("flow", businessFlowId);
  }

  if (fromSearch) {
    searchParams.set("q", fromSearch);
  }

  return `${getServerRoute(serverName)}?${searchParams.toString()}`;
};

export { CubeWorkspaceHeader };
