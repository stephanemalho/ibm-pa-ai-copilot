import "server-only";

import { getIbmPaRuntimeConfig } from "@/server/ibm-pa/config";
import { getIbmPaMode } from "@/server/ibm-pa/env";
import { IbmPaResponseParseError, isIbmPaError } from "@/server/ibm-pa/errors";
import { logIbmPaInfo } from "@/server/ibm-pa/logger";
import {
  MOCK_CUBE_NAME,
  MOCK_SERVER_ID,
  mockCubeDimensions,
  mockCubeSampleMembers,
  mockCubes,
  mockMetadataMapping,
  mockMdxResult,
  mockRecentMessageLogs,
  mockTm1Servers,
} from "@/server/ibm-pa/mock-data";
import { requestIbmPaJson } from "@/server/ibm-pa/request";
import {
  ibmPaCollectionSchema,
  mdxExecuteResponseSchema,
  rawNamedItemSchema,
  rawServerSchema,
} from "@/server/ibm-pa/schemas";
import { getStoredIbmPaSession } from "@/server/ibm-pa/session-store";
import type {
  CubeAccessibilityDiagnostic,
  CubeAccessibilityDiagnosticsResult,
  CubeDimension,
  CubeDimensionStructureDiagnostic,
  CubeDimensionStructureResult,
  CubeDimensionsResult,
  CubeSampleMemberSet,
  CubeSampleMembersResult,
  CubeSummary,
  DimensionAccessibilityDiagnostic,
  DimensionAccessibilityDiagnosticsResult,
  GetCubeDimensionsParams,
  GetMetadataMappingParams,
  GetRecentMessageLogsParams,
  GetDimensionAccessibilityDiagnosticParams,
  GetCubeSampleMembersParams,
  IbmPaHealthStatus,
  ListCubesParams,
  ListCubesResult,
  ListTm1ServersResult,
  MdxAxis,
  MdxCell,
  MdxQueryResult,
  RunMdxParams,
  Tm1AttributeMap,
  Tm1HierarchyMetadata,
  Tm1LocalizedAttributeMap,
  Tm1MappingEdge,
  Tm1MappingNode,
  Tm1MessageLogEntry,
  Tm1Member,
  Tm1MetadataMappingResult,
  Tm1RecentMessageLogsResult,
  Tm1ServerAccessibilityDiagnostic,
  Tm1ServerAccessibilityDiagnosticsResult,
  Tm1ServerSummary,
} from "@/server/ibm-pa/types";

const diagnosticProbeConcurrency = 4;

type Tm1ProcessDefinition = {
  dataProcedure?: string;
  epilogProcedure?: string;
  metadataProcedure?: string;
  name: string;
  prologProcedure?: string;
  serverName: string;
};

class IbmPaClient {
  public async getHealth(): Promise<IbmPaHealthStatus> {
    const runtimeConfig = getIbmPaRuntimeConfig();

    if (runtimeConfig.mode === "mock") {
      return {
        authenticated: false,
        availableServerCount: mockTm1Servers.length,
        configured: false,
        mode: "mock",
        status: "ok",
        targetTm1Server: runtimeConfig.targetTm1Server ?? MOCK_SERVER_ID,
      };
    }

    const serversResult = await this.listTm1Servers();
    const targetTm1Server = await this.resolveServerName();

    return {
      authenticated: Boolean(getStoredIbmPaSession()),
      availableServerCount: serversResult.servers.length,
      configured: runtimeConfig.isConfigured,
      mode: "live",
      status: "ok",
      targetTm1Server,
    };
  }

  public async listTm1Servers(): Promise<ListTm1ServersResult> {
    if (getIbmPaMode() === "mock") {
      logIbmPaInfo("IBM PA server discovery is using mock mode.", {
        operation: "listTm1Servers",
      });

      return {
        mode: "mock",
        servers: mockTm1Servers,
      };
    }

    const payload = await requestIbmPaJson({
      path: "/tm1/Servers?$expand=*",
      scope: {
        kind: "tenant",
      },
    });
    const items = extractCollectionItems(payload, "tm1 servers");

    return {
      mode: "live",
      servers: items.map((item) => normalizeServer(item)),
    };
  }

  public async listCubes(params?: ListCubesParams): Promise<ListCubesResult> {
    const serverName = await this.resolveServerName(params?.serverName);

    if (getIbmPaMode() === "mock") {
      logIbmPaInfo("IBM PA cube discovery is using mock mode.", {
        operation: "listCubes",
        serverName,
      });

      return {
        cubes: mockCubes.filter((cube) => cube.serverName === serverName),
        mode: "mock",
        serverName,
      };
    }

    const payload = await requestIbmPaJson({
      path: "/Cubes?$select=Name,Attributes,LastSchemaUpdate,LastDataUpdate&$expand=LocalizedAttributes",
      scope: {
        kind: "tm1",
        serverName,
      },
    });
    const items = extractCollectionItems(payload, "cubes");

    return {
      cubes: items.map((item) => normalizeCubeSummary(item, serverName)),
      mode: "live",
      serverName,
    };
  }

  public async getServerAccessibilityDiagnostics(): Promise<Tm1ServerAccessibilityDiagnosticsResult> {
    const serversResult = await this.listTm1Servers();

    if (serversResult.mode === "mock") {
      return {
        mode: "mock",
        servers: serversResult.servers.map((server) => {
          return {
            kind: "server",
            classification: "accessible",
            message:
              "Mock mode is active, so this server is treated as accessible for diagnostics.",
            name: server.id,
            reachable: true,
          };
        }),
      };
    }

    const diagnostics = await Promise.all(
      serversResult.servers.map(async (server) => {
        return this.getSingleServerAccessibilityDiagnostic(server.id);
      }),
    );

    return {
      mode: "live",
      servers: diagnostics,
    };
  }

  public async getCubeAccessibilityDiagnostics(
    serverName: string,
  ): Promise<CubeAccessibilityDiagnosticsResult> {
    const cubesResult = await this.listCubes({
      serverName,
    });

    if (cubesResult.mode === "mock") {
      return {
        cubes: cubesResult.cubes.map((cube) => {
          return {
            ...cube,
            kind: "cube",
            classification: "accessible",
            message:
              "Mock mode is active, so this cube is treated as accessible for diagnostics.",
            reachable: true,
          };
        }),
        mode: "mock",
        serverName,
      };
    }

    const diagnostics = await mapWithConcurrency(
      cubesResult.cubes,
      diagnosticProbeConcurrency,
      async (cube) => {
        return this.getSingleCubeAccessibilityDiagnostic(cube);
      },
    );

    return {
      cubes: diagnostics,
      mode: "live",
      serverName,
    };
  }

  public async getDimensionAccessibilityDiagnostics(params: {
    cubeName: string;
    sampleSize?: number;
    serverName: string;
  }): Promise<DimensionAccessibilityDiagnosticsResult> {
    const dimensionsResult = await this.getCubeDimensions({
      cubeName: params.cubeName,
      serverName: params.serverName,
    });
    const sampleSize = params.sampleSize ?? 5;

    if (dimensionsResult.mode === "mock") {
      return {
        cubeName: params.cubeName,
        dimensions: mockCubeDimensions
          .filter(
            (dimension) =>
              dimension.cubeName === params.cubeName &&
              dimension.serverName === params.serverName,
          )
          .map((dimension) => {
            const matchingMembers = mockCubeSampleMembers.find(
              (memberSet) =>
                memberSet.cubeName === params.cubeName &&
                memberSet.dimensionName === dimension.dimensionName &&
                memberSet.serverName === params.serverName,
            );

            return {
              ...buildDimensionMetadata(
                dimension.dimensionName ?? dimension.name,
              ),
              kind: "dimension",
              classification: "accessible",
              cubeName: params.cubeName,
              dimensionName: dimension.dimensionName ?? dimension.name,
              ...(dimension.hierarchyName
                ? {
                    hierarchy: buildHierarchyMetadata(dimension.hierarchyName),
                    hierarchyName: dimension.hierarchyName,
                  }
                : {}),
              members: matchingMembers?.members ?? [],
              message:
                "Mock mode is active, so this dimension is treated as accessible for diagnostics.",
              reachable: true,
              serverName: params.serverName,
            };
          }),
        mode: "mock",
        serverName: params.serverName,
      };
    }

    const diagnostics = await mapWithConcurrency(
      dimensionsResult.dimensions,
      diagnosticProbeConcurrency,
      async (dimension) => {
        return this.getSingleDimensionAccessibilityDiagnostic({
          cubeName: params.cubeName,
          dimension,
          sampleSize,
          serverName: params.serverName,
        });
      },
    );

    return {
      cubeName: params.cubeName,
      dimensions: diagnostics,
      mode: "live",
      serverName: params.serverName,
    };
  }

  public async getCubeDimensions(
    params: GetCubeDimensionsParams,
  ): Promise<CubeDimensionsResult> {
    const serverName = await this.resolveServerName(params.serverName);

    if (getIbmPaMode() === "mock") {
      logIbmPaInfo("IBM PA cube dimensions are using mock mode.", {
        cubeName: params.cubeName,
        operation: "getCubeDimensions",
        serverName,
      });

      return {
        dimensions: mockCubeDimensions.filter(
          (dimension) =>
            dimension.cubeName === params.cubeName &&
            dimension.serverName === serverName,
        ),
        mode: "mock",
        serverName,
      };
    }

    const payload = await requestIbmPaJson({
      path: `/Cubes('${escapeODataStringLiteral(params.cubeName)}')/Dimensions?$select=Name,UniqueName,AllLeavesHierarchyName,Attributes&$expand=LocalizedAttributes`,
      scope: {
        kind: "tm1",
        serverName,
      },
    });
    const items = extractCollectionItems(payload, "cube dimensions");

    return {
      dimensions: items.map((item) => {
        return {
          ...normalizeDimensionSummary(item),
          cubeName: params.cubeName,
          serverName,
        };
      }),
      mode: "live",
      serverName,
    };
  }

  public async getCubeDimensionStructure(params: {
    cubeName: string;
    serverName: string;
  }): Promise<CubeDimensionStructureResult> {
    const dimensionsResult = await this.getCubeDimensions({
      cubeName: params.cubeName,
      serverName: params.serverName,
    });

    if (dimensionsResult.mode === "mock") {
      return {
        cubeName: params.cubeName,
        dimensions: mockCubeDimensions
          .filter(
            (dimension) =>
              dimension.cubeName === params.cubeName &&
              dimension.serverName === params.serverName,
          )
          .map((dimension) => {
            return {
              ...buildDimensionMetadata(
                dimension.dimensionName ?? dimension.name,
              ),
              kind: "dimension",
              classification: "accessible",
              cubeName: params.cubeName,
              ...(dimension.hierarchyName
                ? {
                    hierarchy: buildHierarchyMetadata(dimension.hierarchyName),
                    hierarchyName: dimension.hierarchyName,
                  }
                : {}),
              message:
                "Mock mode is active, so this dimension is treated as accessible for structure diagnostics.",
              reachable: true,
              serverName: params.serverName,
            };
          }),
        mode: "mock",
        serverName: params.serverName,
      };
    }

    const diagnostics = await mapWithConcurrency(
      dimensionsResult.dimensions,
      diagnosticProbeConcurrency,
      async (dimension) => {
        return this.getSingleDimensionStructureDiagnostic({
          cubeName: params.cubeName,
          dimension,
          serverName: params.serverName,
        });
      },
    );

    return {
      cubeName: params.cubeName,
      dimensions: diagnostics,
      mode: "live",
      serverName: params.serverName,
    };
  }

  public async getCubeSampleMembers(
    params: GetCubeSampleMembersParams,
  ): Promise<CubeSampleMembersResult> {
    const serverName = await this.resolveServerName(params.serverName);
    const sampleSize = params.sampleSize ?? 5;

    if (getIbmPaMode() === "mock") {
      logIbmPaInfo("IBM PA sample members are using mock mode.", {
        cubeName: params.cubeName,
        operation: "getCubeSampleMembers",
        sampleSize,
        serverName,
      });

      return {
        members: mockCubeSampleMembers.filter(
          (memberSet) =>
            memberSet.cubeName === params.cubeName &&
            memberSet.serverName === serverName,
        ),
        mode: "mock",
        serverName,
      };
    }

    const dimensionsResult = await this.getCubeDimensions({
      cubeName: params.cubeName,
      serverName,
    });

    const members = await Promise.all(
      dimensionsResult.dimensions.map(async (dimension) => {
        return this.getDimensionSampleMembers({
          cubeName: params.cubeName,
          dimension,
          sampleSize,
          serverName,
        });
      }),
    );

    return {
      members,
      mode: "live",
      serverName,
    };
  }

  public async runMdx(params: RunMdxParams): Promise<MdxQueryResult> {
    const serverName = await this.resolveServerName(params.serverName);

    if (getIbmPaMode() === "mock") {
      logIbmPaInfo("IBM PA MDX execution is using mock mode.", {
        cubeName: params.cubeName ?? MOCK_CUBE_NAME,
        operation: "runMdx",
        serverName,
      });

      return {
        ...mockMdxResult,
        mdx: params.mdx,
        serverName,
        ...((params.cubeName ?? mockMdxResult.cubeName)
          ? {
              cubeName: params.cubeName ?? mockMdxResult.cubeName,
            }
          : {}),
      };
    }

    const payload = await requestIbmPaJson({
      body: {
        MDX: params.mdx,
      },
      method: "POST",
      path: "/ExecuteMDX?$expand=Axes($expand=Tuples($expand=Members($select=Name,UniqueName;$expand=Element($select=Name)))),Cells($select=Value,FormattedValue)",
      scope: {
        kind: "tm1",
        serverName,
      },
    });
    const parsedPayload = mdxExecuteResponseSchema.safeParse(payload);

    if (!parsedPayload.success) {
      throw new IbmPaResponseParseError(
        "IBM Planning Analytics returned an unexpected ExecuteMDX payload.",
        {
          cubeName: params.cubeName,
          serverName,
        },
        parsedPayload.error,
      );
    }

    return {
      axes: parsedPayload.data.Axes.map((axis, axisIndex): MdxAxis => {
        return {
          ordinal: axisIndex,
          tuples: axis.Tuples.map((tuple, tupleIndex) => {
            return {
              members: tuple.Members.map((member) => {
                return {
                  ...(member.Element?.Name
                    ? {
                        elementName: member.Element.Name,
                      }
                    : {}),
                  ...(member.Name
                    ? {
                        name: member.Name,
                      }
                    : {}),
                  ...(member.UniqueName
                    ? {
                        uniqueName: member.UniqueName,
                      }
                    : {}),
                };
              }),
              ordinal: tupleIndex,
            };
          }),
        };
      }),
      cells: parsedPayload.data.Cells.map((cell, cellIndex): MdxCell => {
        return {
          ordinal: cellIndex,
          value: cell.Value,
          ...(cell.FormattedValue === undefined
            ? {}
            : {
                formattedValue: cell.FormattedValue,
              }),
        };
      }),
      mdx: params.mdx,
      serverName,
      ...(params.cubeName
        ? {
            cubeName: params.cubeName,
          }
        : {}),
    };
  }

  public async getRecentMessageLogs(
    params: GetRecentMessageLogsParams = {},
  ): Promise<Tm1RecentMessageLogsResult> {
    const serverName = await this.resolveServerName(params.serverName);
    const minutes = params.minutes ?? 10;
    const limit = params.limit ?? 100;
    const levelFilter = params.level?.trim().toUpperCase();
    const cutoffDate = new Date(Date.now() - minutes * 60 * 1000);

    if (getIbmPaMode() === "mock") {
      const filteredEntries = mockRecentMessageLogs.entries.filter((entry) => {
        if (!levelFilter) {
          return true;
        }

        return entry.level.toUpperCase() === levelFilter;
      });

      return {
        ...mockRecentMessageLogs,
        ...(levelFilter
          ? {
              levelFilter,
            }
          : {}),
        cutoffTimestamp: cutoffDate.toISOString(),
        entries: filteredEntries.slice(0, limit),
        limit,
        minutes,
        returnedEntryCount: Math.min(filteredEntries.length, limit),
        scannedEntryCount: mockRecentMessageLogs.scannedEntryCount,
        serverName,
      };
    }

    const scanLimit = Math.min(Math.max(limit * 3, 100), 500);
    const payload = await requestIbmPaJson({
      path: `/MessageLogEntries?$select=ID,ThreadID,SessionID,Level,TimeStamp,Logger,Message&$orderby=TimeStamp desc&$top=${scanLimit}`,
      scope: {
        kind: "tm1",
        serverName,
      },
    });
    const items = extractCollectionItems(payload, "message log entries");
    const normalizedEntries = items
      .map((item) => normalizeMessageLogEntry(item, serverName))
      .filter((entry): entry is Tm1MessageLogEntry => {
        return entry !== null;
      });
    const filteredEntries = normalizedEntries.filter((entry) => {
      const timestamp = Date.parse(entry.timestamp);

      if (!Number.isFinite(timestamp) || timestamp < cutoffDate.getTime()) {
        return false;
      }

      if (!levelFilter) {
        return true;
      }

      return entry.level.toUpperCase() === levelFilter;
    });

    return {
      ...(levelFilter
        ? {
            levelFilter,
          }
        : {}),
      cutoffTimestamp: cutoffDate.toISOString(),
      entries: filteredEntries.slice(0, limit),
      levels: getUniqueLogLevels(normalizedEntries),
      limit,
      minutes,
      mode: "live",
      returnedEntryCount: Math.min(filteredEntries.length, limit),
      scannedEntryCount: normalizedEntries.length,
      serverName,
    };
  }

  public async getMetadataMapping(
    params: GetMetadataMappingParams = {},
  ): Promise<Tm1MetadataMappingResult> {
    const serverName = await this.resolveServerName(params.serverName);
    const includeProcesses = params.includeProcesses ?? true;
    const maxCubes = params.maxCubes ?? 25;

    if (getIbmPaMode() === "mock") {
      if (includeProcesses) {
        return mockMetadataMapping;
      }

      return {
        ...mockMetadataMapping,
        edges: mockMetadataMapping.edges.filter(
          (edge) => edge.kind !== "mentions",
        ),
        nodes: mockMetadataMapping.nodes.filter(
          (node) => node.kind !== "process",
        ),
        summary: {
          ...mockMetadataMapping.summary,
          edgeCount: mockMetadataMapping.edges.filter(
            (edge) => edge.kind !== "mentions",
          ).length,
          includesProcesses: false,
          processCount: 0,
        },
      };
    }

    const cubesResult = await this.listCubes({
      serverName,
    });
    const cubes = cubesResult.cubes.slice(0, maxCubes);
    const dimensionResults = await Promise.all(
      cubes.map(async (cube) => {
        return this.getCubeDimensions({
          cubeName: cube.name,
          serverName,
        });
      }),
    );

    const nodes = new Map<string, Tm1MappingNode>();
    const edges = new Map<string, Tm1MappingEdge>();
    const serverNodeId = `server:${serverName}`;
    const uniqueDimensionNames = new Set<string>();

    nodes.set(serverNodeId, {
      id: serverNodeId,
      kind: "server",
      label: serverName,
      secondaryLabel: "TM1 server",
      serverName,
    });

    for (const cube of cubes) {
      const cubeNodeId = `cube:${cube.name}`;

      nodes.set(cubeNodeId, {
        id: cubeNodeId,
        kind: "cube",
        label: cube.name,
        secondaryLabel: cube.caption ?? "Cube",
        serverName,
      });
      edges.set(`edge:${serverNodeId}:${cubeNodeId}`, {
        id: `edge:${serverNodeId}:${cubeNodeId}`,
        kind: "contains",
        label: "contains",
        source: serverNodeId,
        target: cubeNodeId,
      });
    }

    for (const dimensionResult of dimensionResults) {
      for (const dimension of dimensionResult.dimensions) {
        const dimensionName = dimension.dimensionName ?? dimension.name;
        const cubeNodeId = `cube:${dimension.cubeName}`;
        const dimensionNodeId = `dimension:${dimensionName}`;

        uniqueDimensionNames.add(dimensionName);
        nodes.set(dimensionNodeId, {
          id: dimensionNodeId,
          kind: "dimension",
          label: dimensionName,
          secondaryLabel: dimension.hierarchyName ?? "Dimension",
          serverName,
        });
        edges.set(`edge:${cubeNodeId}:${dimensionNodeId}`, {
          id: `edge:${cubeNodeId}:${dimensionNodeId}`,
          kind: "uses",
          label: "uses",
          source: cubeNodeId,
          target: dimensionNodeId,
        });
      }
    }

    if (includeProcesses) {
      const processes = await this.listProcesses(serverName);

      for (const process of processes) {
        const processReferences = collectProcessReferences(
          process,
          cubes,
          uniqueDimensionNames,
        );

        if (
          processReferences.cubes.size === 0 &&
          processReferences.dimensions.size === 0
        ) {
          continue;
        }

        const processNodeId = `process:${process.name}`;
        nodes.set(processNodeId, {
          id: processNodeId,
          kind: "process",
          label: process.name,
          secondaryLabel: "TI process",
          serverName,
        });

        for (const cubeName of processReferences.cubes) {
          const cubeNodeId = `cube:${cubeName}`;
          edges.set(`edge:${processNodeId}:${cubeNodeId}`, {
            id: `edge:${processNodeId}:${cubeNodeId}`,
            kind: "mentions",
            label: "mentions cube",
            source: processNodeId,
            target: cubeNodeId,
          });
        }

        for (const dimensionName of processReferences.dimensions) {
          const dimensionNodeId = `dimension:${dimensionName}`;
          edges.set(`edge:${processNodeId}:${dimensionNodeId}`, {
            id: `edge:${processNodeId}:${dimensionNodeId}`,
            kind: "mentions",
            label: "mentions dimension",
            source: processNodeId,
            target: dimensionNodeId,
          });
        }
      }
    }

    const nodeList = Array.from(nodes.values()).sort(compareMappingNodes);
    const edgeList = Array.from(edges.values()).sort((left, right) => {
      return left.id.localeCompare(right.id);
    });

    return {
      edges: edgeList,
      mode: "live",
      nodes: nodeList,
      serverName,
      summary: {
        cubeCount: nodeList.filter((node) => node.kind === "cube").length,
        dimensionCount: nodeList.filter((node) => node.kind === "dimension")
          .length,
        edgeCount: edgeList.length,
        includesProcesses: includeProcesses,
        processCount: nodeList.filter((node) => node.kind === "process").length,
      },
    };
  }

  public async getDimensionAccessibilityDiagnostic(
    params: GetDimensionAccessibilityDiagnosticParams,
  ): Promise<DimensionAccessibilityDiagnostic> {
    const serverName = await this.resolveServerName(params.serverName);
    const sampleSize = params.sampleSize ?? 8;

    if (getIbmPaMode() === "mock") {
      const matchingDimension = mockCubeDimensions.find(
        (dimension) =>
          dimension.cubeName === params.cubeName &&
          dimension.dimensionName === params.dimensionName &&
          dimension.serverName === serverName,
      );
      const matchingMembers = mockCubeSampleMembers.find(
        (memberSet) =>
          memberSet.cubeName === params.cubeName &&
          memberSet.dimensionName === params.dimensionName &&
          memberSet.serverName === serverName,
      );

      if (!matchingDimension) {
        return {
          ...buildDimensionMetadata(params.dimensionName),
          kind: "dimension",
          classification: "server_not_reachable_by_endpoint",
          cubeName: params.cubeName,
          dimensionName: params.dimensionName,
          members: [],
          message: "The requested dimension was not found in mock mode.",
          reachable: false,
          serverName,
        };
      }

      return {
        ...buildDimensionMetadata(params.dimensionName),
        kind: "dimension",
        classification: "accessible",
        cubeName: params.cubeName,
        dimensionName: params.dimensionName,
        ...(matchingDimension.hierarchyName
          ? {
              hierarchy: buildHierarchyMetadata(
                matchingDimension.hierarchyName,
              ),
              hierarchyName: matchingDimension.hierarchyName,
            }
          : {}),
        members: matchingMembers?.members.slice(0, sampleSize) ?? [],
        message:
          "Mock mode is active, so this dimension is treated as accessible for diagnostics.",
        reachable: true,
        serverName,
      };
    }

    const dimensionsResult = await this.getCubeDimensions({
      cubeName: params.cubeName,
      serverName,
    });
    const matchingDimension = dimensionsResult.dimensions.find(
      (dimension) => dimension.dimensionName === params.dimensionName,
    ) ?? {
      ...buildDimensionMetadata(params.dimensionName),
      cubeName: params.cubeName,
      serverName,
    };

    return this.getSingleDimensionAccessibilityDiagnostic({
      cubeName: params.cubeName,
      dimension: matchingDimension,
      sampleSize,
      serverName,
    });
  }

  private async getDimensionSampleMembers(params: {
    cubeName: string;
    dimension: CubeDimension;
    sampleSize: number;
    serverName: string;
  }): Promise<CubeSampleMemberSet> {
    const hierarchy = await this.getPrimaryHierarchyMetadata(
      params.dimension.dimensionName ?? params.dimension.name,
      params.serverName,
    );
    const items = await this.getDimensionSampleMemberItems({
      dimensionName: params.dimension.dimensionName ?? params.dimension.name,
      hierarchyName: hierarchy.name,
      sampleSize: params.sampleSize,
      serverName: params.serverName,
    });

    return {
      cubeName: params.cubeName,
      dimensionName: params.dimension.dimensionName ?? params.dimension.name,
      hierarchyName: hierarchy.name,
      members: items.map((item) => normalizeMember(item)),
      serverName: params.serverName,
    };
  }

  private async getDimensionSampleMemberItems(params: {
    dimensionName: string;
    hierarchyName: string;
    sampleSize: number;
    serverName: string;
  }): Promise<Record<string, unknown>[]> {
    try {
      const payload = await requestIbmPaJson({
        path: `/Dimensions('${escapeODataStringLiteral(params.dimensionName)}')/Hierarchies('${escapeODataStringLiteral(params.hierarchyName)}')/Members?$select=Name,UniqueName,Type,Ordinal,IsPlaceholder,Weight,Attributes&$expand=LocalizedAttributes,Element($select=Name,UniqueName,Type,Level,Index,Attributes;$expand=LocalizedAttributes)&$top=${params.sampleSize}`,
        scope: {
          kind: "tm1",
          serverName: params.serverName,
        },
      });

      return extractCollectionItems(payload, "dimension members");
    } catch (error) {
      if (!isIbmPaError(error) || error.statusCode !== 400) {
        throw error;
      }

      const payload = await requestIbmPaJson({
        path: `/Dimensions('${escapeODataStringLiteral(params.dimensionName)}')/Hierarchies('${escapeODataStringLiteral(params.hierarchyName)}')/Elements?$select=Name,UniqueName,Type,Level,Index,Attributes&$expand=LocalizedAttributes&$top=${params.sampleSize}`,
        scope: {
          kind: "tm1",
          serverName: params.serverName,
        },
      });

      return extractCollectionItems(payload, "dimension elements");
    }
  }

  private async getPrimaryHierarchyMetadata(
    dimensionName: string,
    serverName: string,
  ): Promise<Tm1HierarchyMetadata> {
    const payload = await requestIbmPaJson({
      path: `/Dimensions('${escapeODataStringLiteral(dimensionName)}')/Hierarchies?$select=Name,UniqueName,Cardinality,Structure,Visible,Attributes&$expand=LocalizedAttributes&$top=1`,
      scope: {
        kind: "tm1",
        serverName,
      },
    });
    const items = extractCollectionItems(payload, "dimension hierarchies");
    const primaryHierarchy = items[0];

    if (!primaryHierarchy) {
      return buildHierarchyMetadata(dimensionName);
    }

    return normalizeHierarchyMetadata(primaryHierarchy, dimensionName);
  }

  private async listProcesses(
    serverName: string,
  ): Promise<Tm1ProcessDefinition[]> {
    const payload = await requestIbmPaJson({
      path: "/Processes?$select=Name,PrologProcedure,MetadataProcedure,DataProcedure,EpilogProcedure&$top=200",
      scope: {
        kind: "tm1",
        serverName,
      },
    });
    const items = extractCollectionItems(payload, "processes");

    return items
      .map((item) => normalizeProcessDefinition(item, serverName))
      .filter((process): process is Tm1ProcessDefinition => {
        return process !== null;
      });
  }

  private async getSingleServerAccessibilityDiagnostic(
    serverName: string,
  ): Promise<Tm1ServerAccessibilityDiagnostic> {
    try {
      await this.listCubes({
        serverName,
      });

      return {
        kind: "server",
        classification: "accessible",
        message: "The server responded to a lightweight cube metadata query.",
        name: serverName,
        reachable: true,
      };
    } catch (error) {
      return classifyServerAccessibilityError(error, serverName);
    }
  }

  private async getSingleCubeAccessibilityDiagnostic(
    cube: CubeSummary,
  ): Promise<CubeAccessibilityDiagnostic> {
    try {
      await this.getCubeDimensions({
        cubeName: cube.name,
        serverName: cube.serverName,
      });

      return {
        ...cube,
        kind: "cube",
        classification: "accessible",
        message:
          "The cube responded to a lightweight dimensions metadata query.",
        reachable: true,
      };
    } catch (error) {
      return {
        ...cube,
        ...classifyResourceAccessibilityError({
          error,
          kind: "cube",
          name: cube.name,
          serverName: cube.serverName,
        }),
      };
    }
  }

  private async getSingleDimensionStructureDiagnostic(params: {
    cubeName: string;
    dimension: CubeDimension;
    serverName: string;
  }): Promise<CubeDimensionStructureDiagnostic> {
    try {
      const hierarchy = await this.getPrimaryHierarchyMetadata(
        params.dimension.dimensionName ?? params.dimension.name,
        params.serverName,
      );

      return {
        ...params.dimension,
        kind: "dimension",
        classification: "accessible",
        cubeName: params.cubeName,
        hierarchy,
        hierarchyName: hierarchy.name,
        message:
          "The dimension responded to a lightweight hierarchy metadata query.",
        reachable: true,
        serverName: params.serverName,
      };
    } catch (error) {
      return {
        ...params.dimension,
        ...classifyResourceAccessibilityError({
          error,
          kind: "dimension",
          name: params.dimension.dimensionName ?? params.dimension.name,
          serverName: params.serverName,
        }),
        cubeName: params.cubeName,
      };
    }
  }

  private async getSingleDimensionAccessibilityDiagnostic(params: {
    cubeName: string;
    dimension: CubeDimension;
    sampleSize: number;
    serverName: string;
  }): Promise<DimensionAccessibilityDiagnostic> {
    try {
      const hierarchy = await this.getPrimaryHierarchyMetadata(
        params.dimension.dimensionName ?? params.dimension.name,
        params.serverName,
      );
      const items = await this.getDimensionSampleMemberItems({
        dimensionName: params.dimension.dimensionName ?? params.dimension.name,
        hierarchyName: hierarchy.name,
        sampleSize: params.sampleSize,
        serverName: params.serverName,
      });

      return {
        ...params.dimension,
        kind: "dimension",
        classification: "accessible",
        cubeName: params.cubeName,
        hierarchy,
        hierarchyName: hierarchy.name,
        members: items.map((item) => normalizeMember(item)),
        message:
          "The dimension responded to a lightweight members metadata query.",
        reachable: true,
        serverName: params.serverName,
      };
    } catch (error) {
      return {
        ...params.dimension,
        ...classifyResourceAccessibilityError({
          error,
          kind: "dimension",
          name: params.dimension.dimensionName ?? params.dimension.name,
          serverName: params.serverName,
        }),
        cubeName: params.cubeName,
        members: [],
      };
    }
  }

  private async resolveServerName(serverName?: string): Promise<string> {
    if (serverName) {
      return serverName;
    }

    const runtimeConfig = getIbmPaRuntimeConfig();

    if (runtimeConfig.targetTm1Server) {
      return runtimeConfig.targetTm1Server;
    }

    if (runtimeConfig.mode === "mock") {
      return MOCK_SERVER_ID;
    }

    const serversResult = await this.listTm1Servers();
    const prioritizedServers = [
      ...serversResult.servers.filter((candidate) => candidate.isDefault),
      ...serversResult.servers.filter((candidate) => !candidate.isDefault),
    ];

    for (const candidate of prioritizedServers) {
      if (await this.isServerMetadataReachable(candidate.id)) {
        return candidate.id;
      }
    }

    return prioritizedServers[0]?.id ?? MOCK_SERVER_ID;
  }

  private async isServerMetadataReachable(
    serverName: string,
  ): Promise<boolean> {
    try {
      await requestIbmPaJson({
        path: "/Cubes?$select=Name&$top=1",
        scope: {
          kind: "tm1",
          serverName,
        },
      });

      return true;
    } catch (error) {
      logIbmPaInfo("Skipping TM1 server that is not reachable for metadata.", {
        operation: "resolveServerName",
        serverName,
        ...(isIbmPaError(error)
          ? {
              statusCode: error.statusCode,
            }
          : {}),
      });

      return false;
    }
  }
}

const ibmPaClient = new IbmPaClient();

const getIbmPaClient = (): IbmPaClient => {
  return ibmPaClient;
};

const extractCollectionItems = (
  payload: unknown,
  entityName: string,
): Record<string, unknown>[] => {
  const parsedPayload = ibmPaCollectionSchema.safeParse(payload);

  if (!parsedPayload.success) {
    throw new IbmPaResponseParseError(
      `IBM Planning Analytics returned an unexpected ${entityName} collection payload.`,
      {
        entityName,
      },
      parsedPayload.error,
    );
  }

  return Array.isArray(parsedPayload.data)
    ? parsedPayload.data
    : parsedPayload.data.value;
};

const normalizeServer = (item: Record<string, unknown>): Tm1ServerSummary => {
  const parsedItem = rawServerSchema.safeParse(item);

  if (!parsedItem.success) {
    throw new IbmPaResponseParseError(
      "IBM Planning Analytics returned an invalid TM1 server item.",
      undefined,
      parsedItem.error,
    );
  }

  const id =
    parsedItem.data.ServerName ??
    parsedItem.data.serverName ??
    parsedItem.data.Name ??
    parsedItem.data.name;

  if (!id) {
    throw new IbmPaResponseParseError(
      "IBM Planning Analytics returned a TM1 server without a usable identifier.",
    );
  }

  const displayName =
    parsedItem.data.Name ??
    parsedItem.data.name ??
    parsedItem.data.ServerName ??
    parsedItem.data.serverName ??
    id;
  const description =
    parsedItem.data.Description ?? parsedItem.data.description;

  if (!description) {
    return {
      displayName,
      id,
      isDefault:
        parsedItem.data.IsDefault ??
        parsedItem.data.Default ??
        parsedItem.data.default ??
        false,
      name: displayName,
    };
  }

  return {
    description,
    displayName,
    id,
    isDefault:
      parsedItem.data.IsDefault ??
      parsedItem.data.Default ??
      parsedItem.data.default ??
      false,
    name: displayName,
  };
};

const normalizeCubeSummary = (
  item: Record<string, unknown>,
  serverName: string,
): CubeSummary => {
  const name = getRequiredName(item, "cube");

  return {
    ...extractMetadataEnvelope(item),
    lastDataUpdate: getOptionalString(item, ["LastDataUpdate"]),
    lastSchemaUpdate: getOptionalString(item, ["LastSchemaUpdate"]),
    name,
    serverName,
    uniqueName: getOptionalString(item, ["UniqueName"]),
  };
};

const normalizeDimensionSummary = (
  item: Record<string, unknown>,
): Omit<CubeDimension, "cubeName" | "serverName"> => {
  const name = getRequiredName(item, "dimension");

  return {
    ...extractMetadataEnvelope(item),
    allLeavesHierarchyName: getOptionalString(item, ["AllLeavesHierarchyName"]),
    dimensionName: name,
    name,
    uniqueName: getOptionalString(item, ["UniqueName"]),
  };
};

const normalizeHierarchyMetadata = (
  item: Record<string, unknown>,
  fallbackName: string,
): Tm1HierarchyMetadata => {
  const name = getOptionalString(item, ["Name"]) ?? fallbackName;

  return {
    ...extractMetadataEnvelope(item),
    cardinality: getOptionalNumber(item, ["Cardinality"]),
    levelNames: [],
    name,
    structure: getOptionalString(item, ["Structure"]),
    uniqueName: getOptionalString(item, ["UniqueName"]),
    visible: getOptionalBoolean(item, ["Visible"]),
  };
};

const normalizeMember = (item: Record<string, unknown>): Tm1Member => {
  const element = getOptionalRecord(item, ["Element"]);
  const name =
    getOptionalString(item, ["Name"]) ??
    (element ? getOptionalString(element, ["Name"]) : undefined) ??
    getRequiredName(item, "member");
  const metadata = extractMetadataEnvelope(item);
  const elementMetadata = element
    ? extractMetadataEnvelope(element)
    : {
        attributes: {},
        caption: undefined,
        localizedAttributes: [],
      };

  return {
    attributes: {
      ...elementMetadata.attributes,
      ...metadata.attributes,
    },
    caption: metadata.caption ?? elementMetadata.caption,
    index:
      getOptionalNumber(item, ["Index"]) ??
      (element ? getOptionalNumber(element, ["Index"]) : undefined),
    isPlaceholder: getOptionalBoolean(item, ["IsPlaceholder"]),
    level:
      getOptionalNumber(item, ["Level"]) ??
      (element ? getOptionalNumber(element, ["Level"]) : undefined),
    localizedAttributes: [
      ...elementMetadata.localizedAttributes,
      ...metadata.localizedAttributes,
    ],
    name,
    ordinal: getOptionalNumber(item, ["Ordinal"]),
    type:
      getOptionalString(item, ["Type"]) ??
      (element ? getOptionalString(element, ["Type"]) : undefined),
    uniqueName:
      getOptionalString(item, ["UniqueName"]) ??
      (element ? getOptionalString(element, ["UniqueName"]) : undefined),
    weight: getOptionalNumber(item, ["Weight"]),
  };
};

const normalizeMessageLogEntry = (
  item: Record<string, unknown>,
  serverName: string,
): Tm1MessageLogEntry | null => {
  const timestamp = getOptionalString(item, ["TimeStamp", "Timestamp"]);
  const message = getOptionalString(item, ["Message"]);
  const level = getOptionalString(item, ["Level"]) ?? "Unknown";
  const logger = getOptionalString(item, ["Logger"]) ?? "TM1";

  if (!timestamp || !message) {
    return null;
  }

  return {
    id:
      getOptionalIdentifier(item, ["ID"]) ??
      `${serverName}:${timestamp}:${level}`,
    level,
    logger,
    message,
    serverName,
    sessionId: getOptionalIdentifier(item, ["SessionID"]),
    threadId: getOptionalIdentifier(item, ["ThreadID"]),
    timestamp,
  };
};

const normalizeProcessDefinition = (
  item: Record<string, unknown>,
  serverName: string,
): Tm1ProcessDefinition | null => {
  const name = getOptionalString(item, ["Name"]);
  const dataProcedure = getOptionalString(item, ["DataProcedure"]);
  const epilogProcedure = getOptionalString(item, ["EpilogProcedure"]);
  const metadataProcedure = getOptionalString(item, ["MetadataProcedure"]);
  const prologProcedure = getOptionalString(item, ["PrologProcedure"]);

  if (!name) {
    return null;
  }

  return {
    name,
    serverName,
    ...(dataProcedure
      ? {
          dataProcedure,
        }
      : {}),
    ...(epilogProcedure
      ? {
          epilogProcedure,
        }
      : {}),
    ...(metadataProcedure
      ? {
          metadataProcedure,
        }
      : {}),
    ...(prologProcedure
      ? {
          prologProcedure,
        }
      : {}),
  };
};

const buildDimensionMetadata = (
  dimensionName: string,
): Pick<
  CubeDimension,
  | "attributes"
  | "caption"
  | "dimensionName"
  | "localizedAttributes"
  | "name"
  | "uniqueName"
> => {
  return {
    attributes: {},
    caption: undefined,
    dimensionName,
    localizedAttributes: [],
    name: dimensionName,
    uniqueName: undefined,
  };
};

const buildHierarchyMetadata = (
  hierarchyName: string,
): Tm1HierarchyMetadata => {
  return {
    attributes: {},
    levelNames: [],
    localizedAttributes: [],
    name: hierarchyName,
  };
};

const extractMetadataEnvelope = (
  item: Record<string, unknown>,
): {
  attributes: Tm1AttributeMap;
  caption?: string | undefined;
  localizedAttributes: Tm1LocalizedAttributeMap;
} => {
  const attributes = extractAttributeMap(item["Attributes"]);
  const localizedAttributes = extractLocalizedAttributeMapCollection(
    item["LocalizedAttributes"],
  );

  return {
    attributes,
    caption:
      extractCaptionFromAttributeMap(attributes) ??
      extractCaptionFromLocalizedAttributes(localizedAttributes),
    localizedAttributes,
  };
};

const extractAttributeMap = (value: unknown): Tm1AttributeMap => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([attributeName, attributeValue]) => {
      if (typeof attributeValue === "string") {
        return [[attributeName, attributeValue]];
      }

      return [];
    }),
  );
};

const extractLocalizedAttributeMapCollection = (
  value: unknown,
): Tm1LocalizedAttributeMap => {
  if (Array.isArray(value)) {
    return value.filter(isRecord).map((entry) => extractAttributeMap(entry));
  }

  if (isRecord(value) && Array.isArray(value.value)) {
    return value.value
      .filter(isRecord)
      .map((entry) => extractAttributeMap(entry));
  }

  return [];
};

const extractCaptionFromLocalizedAttributes = (
  localizedAttributes: Tm1LocalizedAttributeMap,
): string | undefined => {
  for (const localizedAttributesEntry of localizedAttributes) {
    const caption = extractCaptionFromAttributeMap(localizedAttributesEntry);

    if (caption) {
      return caption;
    }
  }

  return undefined;
};

const extractCaptionFromAttributeMap = (
  attributes: Tm1AttributeMap,
): string | undefined => {
  const captionEntry = Object.entries(attributes).find(([attributeName]) => {
    return attributeName.toLowerCase() === "caption";
  });

  return captionEntry?.[1];
};

const getRequiredName = (
  item: Record<string, unknown>,
  entityName: string,
): string => {
  const parsedItem = rawNamedItemSchema.safeParse(item);

  if (!parsedItem.success) {
    throw new IbmPaResponseParseError(
      `IBM Planning Analytics returned an invalid ${entityName} item.`,
      {
        entityName,
      },
      parsedItem.error,
    );
  }

  const resolvedName = parsedItem.data.Name ?? parsedItem.data.name;

  if (!resolvedName) {
    throw new IbmPaResponseParseError(
      `IBM Planning Analytics returned a ${entityName} without a Name field.`,
      {
        entityName,
      },
    );
  }

  return resolvedName;
};

const getOptionalString = (
  item: Record<string, unknown>,
  keys: string[],
): string | undefined => {
  for (const key of keys) {
    const value = item[key];

    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return undefined;
};

const getOptionalIdentifier = (
  item: Record<string, unknown>,
  keys: string[],
): string | undefined => {
  for (const key of keys) {
    const value = item[key];

    if (typeof value === "number") {
      return value.toString();
    }

    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return undefined;
};

const getOptionalNumber = (
  item: Record<string, unknown>,
  keys: string[],
): number | undefined => {
  for (const key of keys) {
    const value = item[key];

    if (typeof value === "number") {
      return value;
    }
  }

  return undefined;
};

const getOptionalBoolean = (
  item: Record<string, unknown>,
  keys: string[],
): boolean | undefined => {
  for (const key of keys) {
    const value = item[key];

    if (typeof value === "boolean") {
      return value;
    }
  }

  return undefined;
};

const getOptionalRecord = (
  item: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> | undefined => {
  for (const key of keys) {
    const value = item[key];

    if (isRecord(value)) {
      return value;
    }
  }

  return undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getUniqueLogLevels = (entries: Tm1MessageLogEntry[]): string[] => {
  return Array.from(
    new Set(
      entries.map((entry) => {
        return entry.level.toUpperCase();
      }),
    ),
  ).sort((left, right) => left.localeCompare(right));
};

const collectProcessReferences = (
  process: Tm1ProcessDefinition,
  cubes: CubeSummary[],
  dimensionNames: Set<string>,
): {
  cubes: Set<string>;
  dimensions: Set<string>;
} => {
  const script = [
    process.prologProcedure,
    process.metadataProcedure,
    process.dataProcedure,
    process.epilogProcedure,
  ]
    .filter((value): value is string => {
      return typeof value === "string" && value.trim().length > 0;
    })
    .join("\n")
    .toLowerCase();
  const referencedCubes = new Set<string>();
  const referencedDimensions = new Set<string>();

  if (!script) {
    return {
      cubes: referencedCubes,
      dimensions: referencedDimensions,
    };
  }

  for (const cube of cubes) {
    if (scriptMentionsIdentifier(script, cube.name)) {
      referencedCubes.add(cube.name);
    }
  }

  for (const dimensionName of dimensionNames) {
    if (scriptMentionsIdentifier(script, dimensionName)) {
      referencedDimensions.add(dimensionName);
    }
  }

  return {
    cubes: referencedCubes,
    dimensions: referencedDimensions,
  };
};

const scriptMentionsIdentifier = (
  source: string,
  candidate: string,
): boolean => {
  const normalizedCandidate = candidate.toLowerCase();
  const escapedCandidate = escapeRegExp(normalizedCandidate);
  const exactPattern = new RegExp(
    `(?:'|\"|\\b)${escapedCandidate}(?:'|\"|\\b)`,
    "i",
  );

  return exactPattern.test(source);
};

const compareMappingNodes = (
  left: Tm1MappingNode,
  right: Tm1MappingNode,
): number => {
  const kindOrder: Record<Tm1MappingNode["kind"], number> = {
    server: 0,
    cube: 1,
    dimension: 2,
    process: 3,
  };

  return (
    kindOrder[left.kind] - kindOrder[right.kind] ||
    left.label.localeCompare(right.label)
  );
};

const escapeODataStringLiteral = (value: string): string => {
  return encodeURIComponent(value.replaceAll("'", "''"));
};

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  const indexedItems = items.map((item, index) => {
    return {
      index,
      item,
    };
  });
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (nextIndex < indexedItems.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      const currentEntry = indexedItems[currentIndex];

      if (!currentEntry) {
        return;
      }

      results[currentEntry.index] = await mapper(
        currentEntry.item,
        currentEntry.index,
      );
    }
  };

  const workerCount = Math.min(concurrency, indexedItems.length);
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      await worker();
    }),
  );

  return results;
};

const getHealth = (): Promise<IbmPaHealthStatus> => {
  return ibmPaClient.getHealth();
};

const listTm1Servers = (): Promise<ListTm1ServersResult> => {
  return ibmPaClient.listTm1Servers();
};

const listCubes = (params?: ListCubesParams): Promise<ListCubesResult> => {
  return ibmPaClient.listCubes(params);
};

const getServerAccessibilityDiagnostics =
  (): Promise<Tm1ServerAccessibilityDiagnosticsResult> => {
    return ibmPaClient.getServerAccessibilityDiagnostics();
  };

const getCubeAccessibilityDiagnostics = (
  serverName: string,
): Promise<CubeAccessibilityDiagnosticsResult> => {
  return ibmPaClient.getCubeAccessibilityDiagnostics(serverName);
};

const getDimensionAccessibilityDiagnostics = (params: {
  cubeName: string;
  sampleSize?: number;
  serverName: string;
}): Promise<DimensionAccessibilityDiagnosticsResult> => {
  return ibmPaClient.getDimensionAccessibilityDiagnostics(params);
};

const getCubeDimensions = (
  params: GetCubeDimensionsParams,
): Promise<CubeDimensionsResult> => {
  return ibmPaClient.getCubeDimensions(params);
};

const getCubeDimensionStructure = (params: {
  cubeName: string;
  serverName: string;
}): Promise<CubeDimensionStructureResult> => {
  return ibmPaClient.getCubeDimensionStructure(params);
};

const getCubeSampleMembers = (
  params: GetCubeSampleMembersParams,
): Promise<CubeSampleMembersResult> => {
  return ibmPaClient.getCubeSampleMembers(params);
};

const getDimensionAccessibilityDiagnostic = (
  params: GetDimensionAccessibilityDiagnosticParams,
): Promise<DimensionAccessibilityDiagnostic> => {
  return ibmPaClient.getDimensionAccessibilityDiagnostic(params);
};

const runMdx = (params: RunMdxParams): Promise<MdxQueryResult> => {
  return ibmPaClient.runMdx(params);
};

const getRecentMessageLogs = (
  params?: GetRecentMessageLogsParams,
): Promise<Tm1RecentMessageLogsResult> => {
  return ibmPaClient.getRecentMessageLogs(params);
};

const getMetadataMapping = (
  params?: GetMetadataMappingParams,
): Promise<Tm1MetadataMappingResult> => {
  return ibmPaClient.getMetadataMapping(params);
};

const classifyServerAccessibilityError = (
  error: unknown,
  serverName: string,
): Tm1ServerAccessibilityDiagnostic => {
  const baseDiagnostic = {
    kind: "server" as const,
    name: serverName,
  };

  if (isIbmPaError(error)) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        ...baseDiagnostic,
        classification: "authenticated_but_not_authorized",
        message:
          "Authentication succeeded, but this account is not authorized to query this metadata resource.",
        reachable: false,
        statusCode: error.statusCode,
      };
    }

    if (error.statusCode === 400 || error.statusCode === 404) {
      return {
        ...baseDiagnostic,
        classification: "server_not_reachable_by_endpoint",
        message: "The metadata endpoint was not reachable for this resource.",
        reachable: false,
        statusCode: error.statusCode,
      };
    }

    return {
      ...baseDiagnostic,
      classification: "unexpected_upstream_error",
      message:
        "The upstream service returned an unexpected error during the access probe.",
      reachable: false,
      statusCode: error.statusCode,
    };
  }

  return {
    ...baseDiagnostic,
    classification: "unexpected_upstream_error",
    message:
      "An unexpected error occurred while probing resource accessibility.",
    reachable: false,
  };
};

function classifyResourceAccessibilityError(params: {
  error: unknown;
  kind: "cube";
  name: string;
  serverName: string;
}): CubeAccessibilityDiagnostic;
function classifyResourceAccessibilityError(params: {
  error: unknown;
  kind: "dimension";
  name: string;
  serverName: string;
}): Omit<
  DimensionAccessibilityDiagnostic,
  "cubeName" | "hierarchyName" | "members"
>;
function classifyResourceAccessibilityError(params: {
  error: unknown;
  kind: "cube" | "dimension";
  name: string;
  serverName: string;
}):
  | CubeAccessibilityDiagnostic
  | Omit<
      DimensionAccessibilityDiagnostic,
      "cubeName" | "hierarchyName" | "members"
    > {
  const baseDiagnostic = {
    kind: params.kind,
    name: params.name,
    serverName: params.serverName,
  };

  if (isIbmPaError(params.error)) {
    if (params.error.statusCode === 401 || params.error.statusCode === 403) {
      return {
        ...baseDiagnostic,
        classification: "authenticated_but_not_authorized",
        message:
          "Authentication succeeded, but this account is not authorized to query this metadata resource.",
        reachable: false,
        statusCode: params.error.statusCode,
      };
    }

    if (params.error.statusCode === 400 || params.error.statusCode === 404) {
      return {
        ...baseDiagnostic,
        classification: "server_not_reachable_by_endpoint",
        message: "The metadata endpoint was not reachable for this resource.",
        reachable: false,
        statusCode: params.error.statusCode,
      };
    }

    return {
      ...baseDiagnostic,
      classification: "unexpected_upstream_error",
      message:
        "The upstream service returned an unexpected error during the access probe.",
      reachable: false,
      statusCode: params.error.statusCode,
    };
  }

  return {
    ...baseDiagnostic,
    classification: "unexpected_upstream_error",
    message:
      "An unexpected error occurred while probing resource accessibility.",
    reachable: false,
  };
}

export {
  getCubeAccessibilityDiagnostics,
  getCubeDimensionStructure,
  getCubeDimensions,
  getCubeSampleMembers,
  getDimensionAccessibilityDiagnostic,
  getDimensionAccessibilityDiagnostics,
  getHealth,
  getIbmPaClient,
  getMetadataMapping,
  getRecentMessageLogs,
  getServerAccessibilityDiagnostics,
  listCubes,
  listTm1Servers,
  runMdx,
};
