import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ServerCard } from "@/features/ibm-pa/components/server-card";
import { getServerAccessibilityDiagnostics } from "@/server/ibm-pa/client";
import { appRoutes } from "@/shared/lib/routes";
import { siteConfig } from "@/shared/lib/site";

export const dynamic = "force-dynamic";

const HomePage = async (): Promise<ReactNode> => {
  const homePageData = await getHomePageData();

  if ("errorMessage" in homePageData) {
    return (
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-panel">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-rose-950">
              IBM explorer unavailable
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-rose-700">
              {homePageData.errorMessage}
            </p>
          </div>
        </section>
      </div>
    );
  }

  const { serverDiagnostics } = homePageData;
  const accessibleServerCount = serverDiagnostics.servers.filter(
    (server) => server.reachable,
  ).length;

  return (
    <div className="space-y-10">
      <section className="grid gap-8 rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-panel backdrop-blur lg:grid-cols-[1.3fr_0.7fr] lg:p-12">
        <div className="space-y-6">
          <div className="inline-flex rounded-full bg-slate-900 px-3 py-1 font-mono text-xs uppercase tracking-[0.24em] text-slate-50">
            IBM Planning Analytics explorer
          </div>

          <div className="space-y-2">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {siteConfig.name}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Explore discovered TM1 servers, verify which ones are usable for
              metadata queries, and inspect cube structure before adding any
              AI-assisted workflows.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={appRoutes.flows}>
                Open business flows
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={appRoutes.ibmServerAccess}>
                Open diagnostics route
              </Link>
            </Button>
          </div>
        </div>

        <Card className="border-slate-200/80 bg-slate-950 text-slate-50">
          <CardHeader>
            <CardTitle>Explorer summary</CardTitle>
            <CardDescription className="text-slate-300">
              The cards below reflect tenant-level discovery plus per-server
              metadata accessibility checks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-200">
            <p>Discovered servers: {serverDiagnostics.servers.length}</p>
            <p>Accessible servers: {accessibleServerCount}</p>
            <p>Mode: {serverDiagnostics.mode}</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-950">TM1 servers</h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Accessible servers are linked to a dedicated exploration view.
            Unavailable servers remain visible so setup and authorization gaps
            are easy to diagnose.
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

const getHomePageData = async (): Promise<
  | {
      serverDiagnostics: Awaited<
        ReturnType<typeof getServerAccessibilityDiagnostics>
      >;
    }
  | {
      errorMessage: string;
    }
> => {
  try {
    return {
      serverDiagnostics: await getServerAccessibilityDiagnostics(),
    };
  } catch (error) {
    return {
      errorMessage:
        error instanceof Error
          ? error.message
          : "The IBM Planning Analytics explorer could not be loaded.",
    };
  }
};

export default HomePage;
