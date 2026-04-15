import { NextResponse } from "next/server";

import {
  getCubeAccessibilityDiagnostics,
  getDimensionAccessibilityDiagnostics,
  getHealth,
  getServerAccessibilityDiagnostics,
  listTm1Servers,
} from "@/server/ibm-pa/client";
import { createIbmPaErrorPayload } from "@/server/ibm-pa/route-utils";
import { requestIbmPaJson } from "@/server/ibm-pa/request";
import { ibmPaCollectionSchema } from "@/server/ibm-pa/schemas";

export const dynamic = "force-dynamic";

const processFetchConcurrency = 2;
const serverFetchConcurrency = 2;

export const GET = async (): Promise<NextResponse> => {
  try {
    const [health, serverSummaries, serverDiagnostics] = await Promise.all([
      getHealth(),
      listTm1Servers(),
      getServerAccessibilityDiagnostics(),
    ]);

    const servers = await mapWithConcurrency(
      serverDiagnostics.servers,
      serverFetchConcurrency,
      async (serverDiagnostic) => {
        if (!serverDiagnostic.reachable) {
          return {
            cubes: [],
            diagnostic: serverDiagnostic,
            dimensionsByCube: [],
            processes: [],
            serverName: serverDiagnostic.name,
            warning:
              "Server is not reachable for cube, dimension, or process extraction.",
          };
        }

        const cubeDiagnostics = await getCubeAccessibilityDiagnostics(
          serverDiagnostic.name,
        );
        const accessibleCubes = cubeDiagnostics.cubes.filter(
          (cube) => cube.reachable,
        );
        const [dimensionsByCube, processes] = await Promise.all([
          mapWithConcurrency(
            accessibleCubes,
            processFetchConcurrency,
            async (cube) => {
              const dimensionDiagnostics =
                await getDimensionAccessibilityDiagnostics({
                  cubeName: cube.name,
                  sampleSize: 10,
                  serverName: serverDiagnostic.name,
                });

              return {
                cubeName: cube.name,
                dimensions: dimensionDiagnostics.dimensions,
              };
            },
          ),
          listProcessesForServer(serverDiagnostic.name),
        ]);

        return {
          cubes: cubeDiagnostics.cubes,
          diagnostic: serverDiagnostic,
          dimensionsByCube,
          processes,
          serverName: serverDiagnostic.name,
        };
      },
    );

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      health,
      note: "This dataset aggregates the IBM Planning Analytics resources currently used or exploitable by the app: servers, cube diagnostics, dimension diagnostics with sample members, and processes when exposed by TM1.",
      serverDiagnostics,
      serverSummaries,
      servers,
    });
  } catch (error) {
    const errorPayload = createIbmPaErrorPayload(error);

    return NextResponse.json(errorPayload.body, {
      status: errorPayload.status,
    });
  }
};

const listProcessesForServer = async (
  serverName: string,
): Promise<
  Array<{
    name: string;
    raw: Record<string, unknown>;
  }>
> => {
  try {
    const payload = await requestIbmPaJson({
      path: "/Processes?$select=Name",
      scope: {
        kind: "tm1",
        serverName,
      },
    });
    const parsedCollection = ibmPaCollectionSchema.safeParse(payload);

    if (!parsedCollection.success) {
      return [];
    }

    const items = Array.isArray(parsedCollection.data)
      ? parsedCollection.data
      : parsedCollection.data.value;

    return items.flatMap((item) => {
      const name = getNamedValue(item);

      if (!name) {
        return [];
      }

      return [
        {
          name,
          raw: item,
        },
      ];
    });
  } catch {
    return [];
  }
};

const getNamedValue = (item: Record<string, unknown>): string | null => {
  const candidateValues = [item.Name, item.name];

  for (const candidateValue of candidateValues) {
    if (
      typeof candidateValue === "string" &&
      candidateValue.trim().length > 0
    ) {
      return candidateValue;
    }
  }

  return null;
};

const mapWithConcurrency = async <TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>,
): Promise<TOutput[]> => {
  if (items.length === 0) {
    return [];
  }

  const results: TOutput[] = new Array(items.length);
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      const currentItem = items[currentIndex];

      if (currentItem === undefined) {
        return;
      }

      results[currentIndex] = await mapper(currentItem, currentIndex);
    }
  };

  await Promise.all(
    Array.from(
      {
        length: Math.min(concurrency, items.length),
      },
      async () => {
        await worker();
      },
    ),
  );

  return results;
};
