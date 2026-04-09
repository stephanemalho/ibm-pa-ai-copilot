import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AccessStatusBadge } from "@/features/ibm-pa/components/access-status-badge";
import { CubeExplorer } from "@/features/ibm-pa/components/cube-explorer";
import { ResourceHealthPanel } from "@/features/ibm-pa/components/resource-health-panel";
import { deriveServerDiagnostics } from "@/features/ibm-pa/lib/diagnostics";
import {
  getCubeAccessibilityDiagnostics,
  getServerAccessibilityDiagnostics,
} from "@/server/ibm-pa/client";

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
    <div className="space-y-8">
      <section className="grid gap-6 rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-panel backdrop-blur xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,0.8fr)] xl:p-10">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <AccessStatusBadge
              classification={server.classification}
              reachable={server.reachable}
            />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Server explorer
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
              {server.name}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              Browse cubes first, then inspect dimensions and member previews in
              a read-only workflow tailored to this TM1 server.
            </p>
          </div>
        </div>

        <ResourceHealthPanel
          badges={[
            serverDiagnosticsSummary.accessStatus,
            serverDiagnosticsSummary.usabilityStatus,
            serverDiagnosticsSummary.semanticCoverageStatus,
          ]}
          description={serverDiagnosticsSummary.summaryMessage}
          metrics={[
            {
              detail: server.message,
              label: "Access status",
              value: serverDiagnosticsSummary.accessStatus.label,
            },
            {
              label: "Visible cubes",
              value: serverDiagnosticsSummary.visibleCubeCount.toString(),
            },
            {
              label: "Accessible cubes",
              value: accessibleCubeCount.toString(),
            },
            {
              detail: "Visible-only or weakly enriched cubes worth consultant review",
              label: "Needs attention",
              value: serverDiagnosticsSummary.limitedCubeCount.toString(),
            },
          ]}
          title="Server diagnostics"
        />
      </section>

      {!server.reachable ? (
        <Card className="border-slate-200 bg-slate-50">
          <CardHeader>
            <CardTitle className="text-xl">Metadata unavailable</CardTitle>
            <CardDescription>
              This TM1 server is visible to the tenant discovery endpoint, but
              it is not currently usable for cube and dimension exploration with
              this account.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : cubeDiagnostics.cubes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">No cubes returned</CardTitle>
            <CardDescription>
              The server responded successfully, but no cubes were returned for
              this account.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <CubeExplorer
          initialCubeName={initialCubeName}
          initialCubes={cubeDiagnostics.cubes}
          initialSearchTerm={initialSearchTerm}
          serverName={serverName}
        />
      )}
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

export default ServerPage;
