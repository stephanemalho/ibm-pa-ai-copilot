import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServerAccessibilityDiagnostics } from "@/server/ibm-pa/client";
import { appRoutes, getServerLogsRoute, getServerRoute } from "@/shared/lib/routes";

export const dynamic = "force-dynamic";

type LogsPageProps = {
  searchParams: Promise<{
    level?: string | string[] | undefined;
    limit?: string | string[] | undefined;
    minutes?: string | string[] | undefined;
    server?: string | string[] | undefined;
  }>;
};

const LogsPage = async ({
  searchParams,
}: LogsPageProps): Promise<ReactNode> => {
  const resolvedSearchParams = await searchParams;
  const selectedServer = getSingleValue(resolvedSearchParams.server);

  if (!selectedServer) {
    return <ServerSelectionRequiredCard sectionName="logs" />;
  }

  const search = new URLSearchParams();
  const minutes = getSingleValue(resolvedSearchParams.minutes);
  const limit = getSingleValue(resolvedSearchParams.limit);
  const level = getSingleValue(resolvedSearchParams.level);

  if (minutes) {
    search.set("minutes", minutes);
  }

  if (limit) {
    search.set("limit", limit);
  }

  if (level) {
    search.set("level", level);
  }

  const destination = search.size > 0
    ? `${getServerLogsRoute(selectedServer)}?${search.toString()}`
    : getServerLogsRoute(selectedServer);

  redirect(destination);
};

const getSingleValue = (
  value: string | string[] | undefined,
): string | undefined => {
  return Array.isArray(value) ? value[0] : value;
};

const ServerSelectionRequiredCard = async ({
  sectionName,
}: {
  sectionName: string;
}): Promise<ReactNode> => {
  const diagnostics = await getServerAccessibilityDiagnostics();
  const accessibleServers = diagnostics.servers.filter(
    (server) => server.reachable,
  );

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="text-amber-950">
          Server selection required
        </CardTitle>
        <CardDescription className="text-amber-800">
          Open {sectionName} from a selected TM1 server. These screens depend on
          the server context and should not be used as global entry points.
        </CardDescription>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild variant="secondary">
            <Link href={appRoutes.home}>Return home</Link>
          </Button>
          {accessibleServers.map((server) => (
            <Button asChild key={server.name} variant="secondary">
              <Link href={getServerRoute(server.name)}>{server.name}</Link>
            </Button>
          ))}
        </div>
      </CardHeader>
    </Card>
  );
};

export default LogsPage;
