import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AccessStatusBadge } from "@/features/ibm-pa/components/access-status-badge";
import { CubeExplorer } from "@/features/ibm-pa/components/cube-explorer";
import {
  getCubeAccessibilityDiagnostics,
  getServerAccessibilityDiagnostics,
} from "@/server/ibm-pa/client";

export const dynamic = "force-dynamic";

type ServerPageProps = {
  params: Promise<{
    serverName: string;
  }>;
};

const ServerPage = async ({ params }: ServerPageProps): Promise<ReactNode> => {
  const resolvedParams = await params;
  const serverName = decodeURIComponent(resolvedParams.serverName);
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
              {server.message}
            </p>
          </div>
        </div>

        <Card className="border-slate-200/80 bg-slate-950 text-slate-50">
          <CardHeader>
            <CardTitle>Server summary</CardTitle>
            <CardDescription className="text-slate-300">
              Metadata exploration remains read-only and uses the existing IBM
              routes and server-side session flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-200">
            <p>Reachable: {server.reachable ? "Yes" : "No"}</p>
            <p>Status code: {server.statusCode ?? "N/A"}</p>
            <p>Cubes discovered: {cubeDiagnostics.cubes.length}</p>
            <p>Accessible cubes: {accessibleCubeCount}</p>
          </CardContent>
        </Card>
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
          initialCubes={cubeDiagnostics.cubes}
          serverName={serverName}
        />
      )}
    </div>
  );
};

export default ServerPage;
