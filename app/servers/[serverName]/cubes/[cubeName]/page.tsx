import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessFlowContextBanner } from "@/features/ibm-pa/components/business-flow-context-banner";
import { CubeWorkspace } from "@/features/ibm-pa/components/cube-workspace";
import { CubeWorkspaceHeader } from "@/features/ibm-pa/components/cube-workspace-header";
import {
  getBusinessFlow,
  getBusinessFlowPreviewDefaults,
} from "@/features/ibm-pa/lib/business-flows";
import {
  getCubeAccessibilityDiagnostics,
  getCubeDimensionStructure,
  getDimensionAccessibilityDiagnostic,
  getDimensionAccessibilityDiagnostics,
  getServerAccessibilityDiagnostics,
} from "@/server/ibm-pa/client";

export const dynamic = "force-dynamic";

type CubeWorkspacePageProps = {
  params: Promise<{
    cubeName: string;
    serverName: string;
  }>;
  searchParams: Promise<{
    dimension?: string | string[] | undefined;
    flow?: string | string[] | undefined;
    fromSearch?: string | string[] | undefined;
  }>;
};

const CubeWorkspacePage = async ({
  params,
  searchParams,
}: CubeWorkspacePageProps): Promise<ReactNode> => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const serverName = decodeURIComponent(resolvedParams.serverName);
  const cubeName = decodeURIComponent(resolvedParams.cubeName);
  const requestedDimension = getSingleSearchParam(resolvedSearchParams.dimension);
  const businessFlowId = getSingleSearchParam(resolvedSearchParams.flow);
  const fromSearch = getSingleSearchParam(resolvedSearchParams.fromSearch);
  const businessFlow = businessFlowId ? getBusinessFlow(businessFlowId) : undefined;
  const diagnostics = await getServerAccessibilityDiagnostics();
  const server = diagnostics.servers.find(
    (candidate) => candidate.name === serverName,
  );

  if (!server) {
    notFound();
  }

  const cubeDiagnostics = server.reachable
    ? await getCubeAccessibilityDiagnostics(serverName)
    : {
        cubes: [],
        mode: diagnostics.mode,
        serverName,
      };
  const cube = cubeDiagnostics.cubes.find((candidate) => candidate.name === cubeName);

  if (!cube) {
    notFound();
  }

  if (!cube.reachable) {
    return (
      <div className="space-y-8">
        <CubeWorkspaceHeader
          businessFlowId={businessFlow?.id}
          cube={cube}
          dimensionCount={0}
          fromSearch={fromSearch}
        />

        {businessFlow ? (
          <BusinessFlowContextBanner
            flow={businessFlow}
            serverName={serverName}
          />
        ) : null}

        <Card className="border-slate-200 bg-slate-50">
          <CardHeader>
            <CardTitle className="text-xl">Cube workspace unavailable</CardTitle>
            <CardDescription>
              This cube remains visible in the catalog, but the current account
              cannot open its structural workspace right now.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const dimensionStructure = await getCubeDimensionStructure({
    cubeName,
    serverName,
  });
  const flowDimensionDiagnostics = businessFlow
    ? await getDimensionAccessibilityDiagnostics({
        cubeName,
        sampleSize: 12,
        serverName,
      })
    : null;
  const businessFlowPreviewDefaults =
    businessFlow && flowDimensionDiagnostics
      ? getBusinessFlowPreviewDefaults(
          businessFlow,
          flowDimensionDiagnostics.dimensions.filter((dimension) => dimension.reachable),
        )
      : undefined;
  const selectedDimensionName =
    requestedDimension ??
    businessFlowPreviewDefaults?.selectedDimensionName ??
    dimensionStructure.dimensions.find((dimension) => dimension.reachable)?.name ??
    null;
  const initialSelectedDimension = selectedDimensionName
    ? (flowDimensionDiagnostics?.dimensions.find(
        (dimension) => dimension.name === selectedDimensionName,
      ) ??
        (dimensionStructure.dimensions.some(
          (dimension) => dimension.name === selectedDimensionName,
        )
          ? await getDimensionAccessibilityDiagnostic({
              cubeName,
              dimensionName: selectedDimensionName,
              sampleSize: 24,
              serverName,
            })
          : null))
    : null;

  return (
    <CubeWorkspace
      businessFlow={businessFlow}
      businessFlowPreviewDefaults={businessFlowPreviewDefaults}
      cube={cube}
      fromSearch={fromSearch}
      initialDimensions={dimensionStructure.dimensions}
      initialSelectedDimension={initialSelectedDimension}
    />
  );
};

const getSingleSearchParam = (
  value: string | string[] | undefined,
): string | undefined => {
  if (typeof value === "string" && value.trim().length > 0) {
    return decodeURIComponent(value);
  }

  if (Array.isArray(value) && value[0]) {
    return decodeURIComponent(value[0]);
  }

  return undefined;
};

export default CubeWorkspacePage;
