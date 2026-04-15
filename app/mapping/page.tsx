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
import { MetadataMappingPanel } from "@/features/ibm-pa/components/metadata-mapping-panel";
import {
  getMetadataMapping,
  getServerAccessibilityDiagnostics,
  listTm1Servers,
} from "@/server/ibm-pa/client";
import { appRoutes, getServerRoute } from "@/shared/lib/routes";

export const dynamic = "force-dynamic";

type MappingPageProps = {
  searchParams: Promise<{
    includeProcesses?: string | string[] | undefined;
    maxCubes?: string | string[] | undefined;
    server?: string | string[] | undefined;
  }>;
};

const MappingPage = async ({
  searchParams,
}: MappingPageProps): Promise<ReactNode> => {
  const resolvedSearchParams = await searchParams;
  const selectedServer = getSingleValue(resolvedSearchParams.server);
  const includeProcesses = parseBoolean(
    getSingleValue(resolvedSearchParams.includeProcesses),
    true,
  );
  const maxCubes = parsePositiveInt(
    getSingleValue(resolvedSearchParams.maxCubes),
    25,
  );

  if (!selectedServer) {
    return <ServerSelectionRequiredCard sectionName="mapping" />;
  }

  const pageData = await getMappingPageData({
    includeProcesses,
    maxCubes,
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
          <CardTitle className="text-rose-950">Mapping unavailable</CardTitle>
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

  const { mappingResult, serversResult } = pageData;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-panel backdrop-blur lg:grid-cols-[1fr_0.55fr]">
        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-slate-900 px-3 py-1 font-mono text-xs uppercase tracking-[0.24em] text-slate-50">
            Metadata mapping
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            TM1 mapping foundation
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            This first version rebuilds a clean metadata graph directly from IBM
            Planning Analytics REST: server, cubes, dimensions, and TI process
            mentions. It gives us a reliable base before we go toward a fuller
            XCare-style dependency engine.
          </p>
        </div>

        <Card className="border-slate-200/80 bg-slate-950 text-slate-50">
          <CardHeader>
            <CardTitle>Raw API</CardTitle>
            <CardDescription className="text-slate-300">
              The mapping graph is also exposed as JSON.
            </CardDescription>
            <div className="pt-2">
              <Button asChild variant="secondary">
                <Link
                  href={buildMappingApiHref(
                    mappingResult.serverName,
                    includeProcesses,
                    maxCubes,
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
            Change the server, include process references, or cap the cube scan
            for faster exploration.
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
                defaultValue={mappingResult.serverName}
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
                htmlFor="includeProcesses"
              >
                Include processes
              </label>
              <Select
                defaultValue={includeProcesses ? "true" : "false"}
                id="includeProcesses"
                name="includeProcesses"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="maxCubes"
              >
                Max cubes
              </label>
              <Input
                defaultValue={maxCubes}
                id="maxCubes"
                max={75}
                min={1}
                name="maxCubes"
                type="number"
              />
            </div>

            <div className="flex items-end">
              <Button type="submit">Apply</Button>
            </div>
          </form>
        </div>
      </Card>

      <MetadataMappingPanel data={mappingResult} />
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

const parseBoolean = (
  value: string | undefined,
  fallbackValue: boolean,
): boolean => {
  if (!value) {
    return fallbackValue;
  }

  return value === "true";
};

const getMappingPageData = async (params: {
  includeProcesses: boolean;
  maxCubes: number;
  serverName?: string;
}): Promise<
  | {
      mappingResult: Awaited<ReturnType<typeof getMetadataMapping>>;
      serversResult: Awaited<ReturnType<typeof listTm1Servers>>;
    }
  | {
      errorMessage: string;
    }
> => {
  try {
    const [serversResult, mappingResult] = await Promise.all([
      listTm1Servers(),
      getMetadataMapping(params),
    ]);

    return {
      mappingResult,
      serversResult,
    };
  } catch (error) {
    return {
      errorMessage:
        error instanceof Error
          ? error.message
          : "The mapping page could not be loaded.",
    };
  }
};

const buildMappingApiHref = (
  serverName: string,
  includeProcesses: boolean,
  maxCubes: number,
): string => {
  const searchParams = new URLSearchParams({
    includeProcesses: includeProcesses ? "true" : "false",
    maxCubes: maxCubes.toString(),
    server: serverName,
  });

  return `${appRoutes.ibmMapping}?${searchParams.toString()}`;
};

export default MappingPage;

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
