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
import { getMetadataMapping } from "@/server/ibm-pa/client";
import { appRoutes, getServerRoute } from "@/shared/lib/routes";

export const dynamic = "force-dynamic";

type ServerMappingPageProps = {
  params: Promise<{
    serverName: string;
  }>;
  searchParams: Promise<{
    includeProcesses?: string | string[] | undefined;
    maxCubes?: string | string[] | undefined;
  }>;
};

const ServerMappingPage = async ({
  params,
  searchParams,
}: ServerMappingPageProps): Promise<ReactNode> => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const serverName = decodeURIComponent(resolvedParams.serverName);
  const includeProcesses = parseBoolean(
    getSingleValue(resolvedSearchParams.includeProcesses),
    true,
  );
  const maxCubes = parsePositiveInt(
    getSingleValue(resolvedSearchParams.maxCubes),
    25,
  );
  const pageData = await getMappingPageData({
    includeProcesses,
    maxCubes,
    serverName,
  });

  if ("errorMessage" in pageData) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardHeader>
          <CardTitle className="text-rose-950">Mapping unavailable</CardTitle>
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

  const { mappingResult } = pageData;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-panel backdrop-blur lg:grid-cols-[1fr_0.55fr]">
        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-slate-900 px-3 py-1 font-mono text-xs uppercase tracking-[0.24em] text-slate-50">
            Metadata mapping
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            TM1 mapping foundation for {serverName}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            This mapping page stays attached to the selected TM1 server and
            rebuilds the graph directly from REST metadata before we move toward
            a fuller XCare-style dependency view.
          </p>
        </div>

        <Card className="border-slate-200/80 bg-slate-950 text-slate-50">
          <CardHeader>
            <CardTitle>Server context</CardTitle>
            <CardDescription className="text-slate-300">
              Keep mapping analysis inside {serverName} or inspect the raw JSON
              graph for debugging.
            </CardDescription>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild variant="secondary">
                <Link href={getServerRoute(serverName)}>Back to server</Link>
              </Button>
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
            Tune process references and cube scan size without losing the
            current server context.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6">
          <form className="grid gap-4 md:grid-cols-3" method="GET">
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
  serverName: string;
}): Promise<
  | {
      mappingResult: Awaited<ReturnType<typeof getMetadataMapping>>;
    }
  | {
      errorMessage: string;
    }
> => {
  try {
    const mappingResult = await getMetadataMapping(params);

    return {
      mappingResult,
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

export default ServerMappingPage;
