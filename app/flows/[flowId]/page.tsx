import { redirect, notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessFlowEntrySection } from "@/features/ibm-pa/components/business-flow-entry-section";
import { ServerCard } from "@/features/ibm-pa/components/server-card";
import {
  getBusinessFlow,
  getBusinessFlowPreviewDefaults,
  getBusinessFlowRecommendedCube,
} from "@/features/ibm-pa/lib/business-flows";
import { getCubeWorkspaceHref } from "@/features/ibm-pa/lib/cube-workspace-url-state";
import {
  getCubeAccessibilityDiagnostics,
  getDimensionAccessibilityDiagnostics,
  getServerAccessibilityDiagnostics,
} from "@/server/ibm-pa/client";
import { getServerRoute } from "@/shared/lib/routes";

export const dynamic = "force-dynamic";

type BusinessFlowResolverPageProps = {
  params: Promise<{
    flowId: string;
  }>;
  searchParams: Promise<{
    server?: string | string[] | undefined;
  }>;
};

const BusinessFlowResolverPage = async ({
  params,
  searchParams,
}: BusinessFlowResolverPageProps): Promise<ReactNode> => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const flow = getBusinessFlow(decodeURIComponent(resolvedParams.flowId));

  if (!flow) {
    notFound();
  }

  const preferredServerName = getSingleSearchParam(resolvedSearchParams.server);
  const serverDiagnostics = await getServerAccessibilityDiagnostics();
  const accessibleServers = serverDiagnostics.servers.filter(
    (server) => server.reachable,
  );
  const candidateServerNames = [
    preferredServerName,
    flow.targetServerName,
    ...accessibleServers.map((server) => server.name),
  ].filter((serverName, index, values): serverName is string => {
    return Boolean(serverName) && values.indexOf(serverName) === index;
  });

  for (const candidateServerName of candidateServerNames) {
    const cubeDiagnostics = await getCubeAccessibilityDiagnostics(candidateServerName);
    const recommendedCube = getBusinessFlowRecommendedCube(
      flow,
      cubeDiagnostics.cubes,
    );

    if (!recommendedCube) {
      continue;
    }

    const dimensionDiagnostics = await getDimensionAccessibilityDiagnostics({
      cubeName: recommendedCube.name,
      sampleSize: 12,
      serverName: candidateServerName,
    });
    const previewDefaults = getBusinessFlowPreviewDefaults(
      flow,
      dimensionDiagnostics.dimensions.filter((dimension) => dimension.reachable),
    );

    redirect(
      getCubeWorkspaceHref({
        businessFlowId: flow.id,
        cubeName: recommendedCube.name,
        previewContextSelections: previewDefaults.previewContextSelections,
        previewRowDimensionName: previewDefaults.previewRowDimensionName,
        selectedDimensionName: previewDefaults.selectedDimensionName,
        serverName: candidateServerName,
      }),
    );
  }

  const fallbackServerName =
    preferredServerName ??
    flow.targetServerName ??
    accessibleServers[0]?.name;

  if (fallbackServerName) {
    redirect(getServerFlowFallbackHref(fallbackServerName, flow.id));
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 shadow-panel">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-amber-950">
            {flow.title} is not available yet
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-amber-900">
            {flow.emptyStateHelpText}
          </p>
          <p className="max-w-3xl text-sm leading-6 text-amber-800">
            {flow.fallbackHelpText}
          </p>
        </div>
      </section>

      <BusinessFlowEntrySection activeFlowId={flow.id} />

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-950">
            Visible servers
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            No accessible server was available for automatic routing, so the
            visible server list stays available for diagnosis.
          </p>
        </div>

        {serverDiagnostics.servers.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">No servers detected</CardTitle>
              <CardDescription>
                The IBM tenant responded, but no TM1 servers were returned.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            {serverDiagnostics.servers.map((server) => (
              <ServerCard key={server.name} server={server} />
            ))}
          </div>
        )}
      </section>
    </div>
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

const getServerFlowFallbackHref = (
  serverName: string,
  flowId: string,
): string => {
  const search = new URLSearchParams({
    flow: flowId,
  });

  return `${getServerRoute(serverName)}?${search.toString()}`;
};

export default BusinessFlowResolverPage;
