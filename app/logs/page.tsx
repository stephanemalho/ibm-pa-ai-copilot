import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { RecentLogsPanel } from "@/features/ibm-pa/components/recent-logs-panel";
import {
  getRecentMessageLogs,
  getServerAccessibilityDiagnostics,
  listTm1Servers,
} from "@/server/ibm-pa/client";
import { appRoutes, getServerRoute } from "@/shared/lib/routes";

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
  const minutes = parsePositiveInt(
    getSingleValue(resolvedSearchParams.minutes),
    10,
  );
  const limit = parsePositiveInt(
    getSingleValue(resolvedSearchParams.limit),
    100,
  );
  const level = getSingleValue(resolvedSearchParams.level);

  if (!selectedServer) {
    return <ServerSelectionRequiredCard sectionName="logs" />;
  }

  const pageData = await getLogsPageData({
    ...(level
      ? {
          level,
        }
      : {}),
    limit,
    minutes,
    ...(selectedServer
      ? {
          serverName: selectedServer,
        }
      : {}),
  });

  if ("errorMessage" in pageData) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardHeader>
          <CardTitle className="text-rose-950">Logs unavailable</CardTitle>
          <CardDescription className="text-rose-700">
            {pageData.errorMessage}
          </CardDescription>
          <div className="pt-2">
            <Button asChild variant="secondary">
              <Link href={appRoutes.home}>Return home</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const { logsResult, serversResult } = pageData;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-panel backdrop-blur lg:grid-cols-[1fr_0.55fr]">
        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-slate-900 px-3 py-1 font-mono text-xs uppercase tracking-[0.24em] text-slate-50">
            TM1 logs
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Recent IBM Planning Analytics logs
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            This screen keeps the volume under control by focusing on the latest
            minutes only. It is a good base to replace the old XCare SQL-backed
            logs screen with direct REST access.
          </p>
        </div>

        <Card className="border-slate-200/80 bg-slate-950 text-slate-50">
          <CardHeader>
            <CardTitle>Raw API</CardTitle>
            <CardDescription className="text-slate-300">
              The same data is also available as JSON through the route handler.
            </CardDescription>
            <div className="pt-2">
              <Button asChild variant="secondary">
                <Link
                  href={buildLogsApiHref(
                    logsResult.serverName,
                    minutes,
                    limit,
                    level,
                  )}
                >
                  Open JSON route
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Choose a TM1 server, time window, and optional log level.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6">
          <form className="grid gap-4 md:grid-cols-4" method="GET">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="server"
              >
                Server
              </label>
              <Select
                defaultValue={logsResult.serverName}
                id="server"
                name="server"
              >
                {serversResult.servers.map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.displayName}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="minutes"
              >
                Minutes
              </label>
              <Input
                defaultValue={minutes}
                id="minutes"
                max={180}
                min={1}
                name="minutes"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="limit"
              >
                Limit
              </label>
              <Input
                defaultValue={limit}
                id="limit"
                max={200}
                min={1}
                name="limit"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="level"
              >
                Level
              </label>
              <div className="flex gap-3">
                <Input
                  defaultValue={level ?? ""}
                  id="level"
                  name="level"
                  placeholder="INFO, WARNING, ERROR"
                />
                <Button className="self-end" type="submit">
                  Apply
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Card>

      <RecentLogsPanel data={logsResult} />
    </div>
  );
};

const getSingleValue = (
  value: string | string[] | undefined,
): string | undefined => {
  return Array.isArray(value) ? value[0] : value;
};

const parsePositiveInt = (
  value: string | undefined,
  fallbackValue: number,
): number => {
  if (!value) {
    return fallbackValue;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallbackValue;
};

const getLogsPageData = async (params: {
  level?: string;
  limit: number;
  minutes: number;
  serverName?: string;
}): Promise<
  | {
      logsResult: Awaited<ReturnType<typeof getRecentMessageLogs>>;
      serversResult: Awaited<ReturnType<typeof listTm1Servers>>;
    }
  | {
      errorMessage: string;
    }
> => {
  try {
    const [serversResult, logsResult] = await Promise.all([
      listTm1Servers(),
      getRecentMessageLogs(params),
    ]);

    return {
      logsResult,
      serversResult,
    };
  } catch (error) {
    return {
      errorMessage:
        error instanceof Error
          ? error.message
          : "The TM1 logs page could not be loaded.",
    };
  }
};

const buildLogsApiHref = (
  serverName: string,
  minutes: number,
  limit: number,
  level?: string,
): string => {
  const searchParams = new URLSearchParams({
    limit: limit.toString(),
    minutes: minutes.toString(),
    server: serverName,
  });

  if (level) {
    searchParams.set("level", level);
  }

  return `${appRoutes.ibmLogs}?${searchParams.toString()}`;
};

export default LogsPage;

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
