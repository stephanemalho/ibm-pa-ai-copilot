import "server-only";

import { getIbmPaRuntimeConfig } from "@/server/ibm-pa/config";
import { getIbmPaMode } from "@/server/ibm-pa/env";
import { IbmPaResponseParseError } from "@/server/ibm-pa/errors";
import { logIbmPaInfo } from "@/server/ibm-pa/logger";
import {
  MOCK_CUBE_NAME,
  MOCK_SERVER_ID,
  mockCubeDimensions,
  mockCubeSampleMembers,
  mockCubes,
  mockMdxResult,
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
  CubeDimension,
  CubeDimensionsResult,
  CubeSampleMemberSet,
  CubeSampleMembersResult,
  GetCubeDimensionsParams,
  GetCubeSampleMembersParams,
  IbmPaHealthStatus,
  ListCubesParams,
  ListCubesResult,
  ListTm1ServersResult,
  MdxAxis,
  MdxCell,
  MdxQueryResult,
  RunMdxParams,
  Tm1ServerSummary,
} from "@/server/ibm-pa/types";

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
      path: "/Cubes?$select=Name",
      scope: {
        kind: "tm1",
        serverName,
      },
    });
    const items = extractCollectionItems(payload, "cubes");

    return {
      cubes: items.map((item) => normalizeNamedSummary(item, serverName)),
      mode: "live",
      serverName,
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
      path: `/Cubes('${escapeODataStringLiteral(params.cubeName)}')/Dimensions?$select=Name`,
      scope: {
        kind: "tm1",
        serverName,
      },
    });
    const items = extractCollectionItems(payload, "cube dimensions");

    return {
      dimensions: items.map((item) => {
        const dimensionName = getRequiredName(item, "cube dimension");

        return {
          cubeName: params.cubeName,
          dimensionName,
          serverName,
        };
      }),
      mode: "live",
      serverName,
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

  private async getDimensionSampleMembers(params: {
    cubeName: string;
    dimension: CubeDimension;
    sampleSize: number;
    serverName: string;
  }): Promise<CubeSampleMemberSet> {
    const hierarchyName = await this.getPrimaryHierarchyName(
      params.dimension.dimensionName,
      params.serverName,
    );
    const payload = await requestIbmPaJson({
      path: `/Dimensions('${escapeODataStringLiteral(params.dimension.dimensionName)}')/Hierarchies('${escapeODataStringLiteral(hierarchyName)}')/Elements?$select=Name&$top=${params.sampleSize}`,
      scope: {
        kind: "tm1",
        serverName: params.serverName,
      },
    });
    const items = extractCollectionItems(payload, "dimension elements");

    return {
      cubeName: params.cubeName,
      dimensionName: params.dimension.dimensionName,
      hierarchyName,
      members: items.map((item) => getRequiredName(item, "dimension element")),
      serverName: params.serverName,
    };
  }

  private async getPrimaryHierarchyName(
    dimensionName: string,
    serverName: string,
  ): Promise<string> {
    const payload = await requestIbmPaJson({
      path: `/Dimensions('${escapeODataStringLiteral(dimensionName)}')/Hierarchies?$select=Name&$top=1`,
      scope: {
        kind: "tm1",
        serverName,
      },
    });
    const items = extractCollectionItems(payload, "dimension hierarchies");
    const primaryHierarchy = items[0];

    if (!primaryHierarchy) {
      return dimensionName;
    }

    return getRequiredName(primaryHierarchy, "dimension hierarchy");
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
    const defaultServer = serversResult.servers.find(
      (candidate) => candidate.isDefault,
    );

    return defaultServer?.id ?? serversResult.servers[0]?.id ?? MOCK_SERVER_ID;
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

const normalizeNamedSummary = (
  item: Record<string, unknown>,
  serverName: string,
): {
  name: string;
  serverName: string;
} => {
  return {
    name: getRequiredName(item, "named item"),
    serverName,
  };
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

const escapeODataStringLiteral = (value: string): string => {
  return value.replaceAll("'", "''");
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

const getCubeDimensions = (
  params: GetCubeDimensionsParams,
): Promise<CubeDimensionsResult> => {
  return ibmPaClient.getCubeDimensions(params);
};

const getCubeSampleMembers = (
  params: GetCubeSampleMembersParams,
): Promise<CubeSampleMembersResult> => {
  return ibmPaClient.getCubeSampleMembers(params);
};

const runMdx = (params: RunMdxParams): Promise<MdxQueryResult> => {
  return ibmPaClient.runMdx(params);
};

export {
  getCubeDimensions,
  getCubeSampleMembers,
  getHealth,
  getIbmPaClient,
  listCubes,
  listTm1Servers,
  runMdx,
};
