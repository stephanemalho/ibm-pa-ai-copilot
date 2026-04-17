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
import { RecentLogsPanel } from "@/features/ibm-pa/components/recent-logs-panel";
import { getRecentMessageLogs } from "@/server/ibm-pa/client";
import { appRoutes, getServerLogsRoute, getServerRoute } from "@/shared/lib/routes";

export const dynamic = "force-dynamic";

type ServerLogsPageProps = {
  params: Promise<{
    serverName: string;
  }>;
  searchParams: Promise<{
    level?: string | string[] | undefined;
    limit?: string | string[] | undefined;
    minutes?: string | string[] | undefined;
  }>;
};

const ServerLogsPage = async ({
  params,
  searchParams,
}: ServerLogsPageProps): Promise<ReactNode> => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const serverName = decodeURIComponent(resolvedParams.serverName);
  const minutes = parsePositiveInt(
    getSingleValue(resolvedSearchParams.minutes),
    60,
  );
  const limit = parsePositiveInt(
    getSingleValue(resolvedSearchParams.limit),
    100,
  );
  const level = getSingleValue(resolvedSearchParams.level);
  const pageData = await getLogsPageData({
    ...(level
      ? {
          level,
        }
      : {}),
    limit,
    minutes,
    serverName,
  });

  if ("errorMessage" in pageData) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardHeader>
          <CardTitle className="text-rose-950">Logs unavailable</CardTitle>
          <CardDescription className="text-rose-700">
            {pageData.errorMessage}
          </CardDescription>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild variant="secondary">
              <Link href={getServerRoute(serverName)}>Return to server</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={appRoutes.home}>Return home</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const { logsResult } = pageData;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-panel backdrop-blur lg:grid-cols-[1fr_0.55fr]">
        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-slate-900 px-3 py-1 font-mono text-xs uppercase tracking-[0.24em] text-slate-50">
            TM1 logs
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Recent IBM Planning Analytics logs for {serverName}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            This viewer stays scoped to the selected TM1 server and tries the
            available REST log sources in order, so the page is explicit about
            what it could read and why a window may still be empty.
          </p>
        </div>

        <Card className="border-slate-200/80 bg-slate-950 text-slate-50">
          <CardHeader>
            <CardTitle>Server context</CardTitle>
            <CardDescription className="text-slate-300">
              Keep navigation inside {serverName} and inspect the raw JSON if
              you need to debug the REST payload.
            </CardDescription>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild variant="secondary">
                <Link href={getServerRoute(serverName)}>Back to server</Link>
              </Button>
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
            Focus on a recent window first, then widen only if needed to avoid
            pulling too much TM1 history at once.
          </CardDescription>
        </CardHeader>
        <div className="space-y-4 px-6 pb-6">
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href={buildPresetHref(serverName, 10, limit, level)}>
                Last 10 minutes
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={buildPresetHref(serverName, 60, limit, level)}>
                Last hour
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={buildPresetHref(serverName, 1440, limit, level)}>
                Last 24 hours
              </Link>
            </Button>
          </div>

          <form className="grid gap-4 md:grid-cols-3" method="GET">
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
                max={1440}
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
  serverName: string;
}): Promise<
  | {
      logsResult: Awaited<ReturnType<typeof getRecentMessageLogs>>;
    }
  | {
      errorMessage: string;
    }
> => {
  try {
    const logsResult = await getRecentMessageLogs(params);

    return {
      logsResult,
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

const buildPresetHref = (
  serverName: string,
  minutes: number,
  limit: number,
  level?: string,
): string => {
  const searchParams = new URLSearchParams({
    limit: limit.toString(),
    minutes: minutes.toString(),
  });

  if (level) {
    searchParams.set("level", level);
  }

  return `${getServerLogsRoute(serverName)}?${searchParams.toString()}`;
};

export default ServerLogsPage;
