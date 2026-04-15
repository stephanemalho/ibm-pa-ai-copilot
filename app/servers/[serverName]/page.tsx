import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AccessStatusBadge } from "@/features/ibm-pa/components/access-status-badge";
import { CubeExplorer } from "@/features/ibm-pa/components/cube-explorer";
import { DiagnosticBadge } from "@/features/ibm-pa/components/diagnostic-badge";
import { ResourceHealthPanel } from "@/features/ibm-pa/components/resource-health-panel";
import { deriveServerDiagnostics } from "@/features/ibm-pa/lib/diagnostics";
import {
  getCubeAccessibilityDiagnostics,
  getServerAccessibilityDiagnostics,
} from "@/server/ibm-pa/client";
import { getServerLogsRoute, getServerMappingRoute } from "@/shared/lib/routes";

export const dynamic = "force-dynamic";

type ServerPageProps = {
  params: Promise<{
    serverName: string;
  }>;
  searchParams: Promise<{
    cube?: string | string[] | undefined;
    flow?: string | string[] | undefined;
    q?: string | string[] | undefined;
  }>;
};

const ServerPage = async ({
  params,
  searchParams,
}: ServerPageProps): Promise<ReactNode> => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const serverName = decodeURIComponent(resolvedParams.serverName);
  const initialCubeName = getSingleSearchParam(resolvedSearchParams.cube);
  const initialSearchTerm = getSingleSearchParam(resolvedSearchParams.q);
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
  const accessibleCubeCount = cubeDiagnostics.cubes.filter(
    (cube) => cube.reachable,
  ).length;
  const serverDiagnosticsSummary = deriveServerDiagnostics(
    server,
    cubeDiagnostics.cubes,
  );

  return (
    <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-x-hidden">
      <div className="mx-auto w-full max-w-[2500px] px-6 sm:px-8">
        <div className="space-y-8">
          {!server.reachable ? (
            <Card className="border-slate-200 bg-slate-50">
              <CardHeader>
                <CardTitle className="text-xl">Metadata unavailable</CardTitle>
                <CardDescription>
                  This TM1 server is visible to the tenant discovery endpoint,
                  but it is not currently usable for cube and dimension
                  exploration with this account.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <CubeExplorer
              contextSidebar={
                <ServerContextRail
                  accessibleCubeCount={accessibleCubeCount}
                  diagnostics={serverDiagnosticsSummary}
                  serverName={serverName}
                  server={server}
                />
              }
              initialCubeName={initialCubeName}
              initialCubes={cubeDiagnostics.cubes}
              initialSearchTerm={initialSearchTerm}
              serverName={serverName}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const ServerContextRail = ({
  accessibleCubeCount,
  diagnostics,
  serverName,
  server,
}: {
  accessibleCubeCount: number;
  diagnostics: ReturnType<typeof deriveServerDiagnostics>;
  serverName: string;
  server: Awaited<
    ReturnType<typeof getServerAccessibilityDiagnostics>
  >["servers"][number];
}): ReactNode => {
  return (
    <>
      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <AccessStatusBadge
              classification={server.classification}
              reachable={server.reachable}
            />
            <DiagnosticBadge status={diagnostics.usabilityStatus} />
            <DiagnosticBadge status={diagnostics.semanticCoverageStatus} />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Server explorer
            </span>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl tracking-tight text-slate-950">
              {server.name}
            </CardTitle>
            <CardDescription className="leading-6">
              Browse cubes, qualify metadata quality, and identify
              visible-but-limited resources from one compact workspace.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <ResourceHealthPanel
        badges={[
          diagnostics.accessStatus,
          diagnostics.usabilityStatus,
          diagnostics.semanticCoverageStatus,
        ]}
        description={diagnostics.summaryMessage}
        metrics={[
          {
            detail: server.message,
            label: "Access status",
            value: diagnostics.accessStatus.label,
          },
          {
            label: "Visible cubes",
            value: diagnostics.visibleCubeCount.toString(),
          },
          {
            label: "Accessible cubes",
            value: accessibleCubeCount.toString(),
          },
          {
            detail:
              "Visible-only or weakly enriched cubes worth consultant review",
            label: "Needs attention",
            value: diagnostics.limitedCubeCount.toString(),
          },
        ]}
        title="Server diagnostics"
      />

      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader className="space-y-4">
          <div className="space-y-2">
            <CardTitle className="text-xl">Server tools</CardTitle>
            <CardDescription>
              Open logs and mapping only inside the current server context.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href={getServerLogsRoute(serverName)}>Open logs</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={getServerMappingRoute(serverName)}>Open mapping</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>
    </>
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

export default ServerPage;
