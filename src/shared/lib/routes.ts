const appRoutes = {
  home: "/",
  flows: "/flows",
  chat: "/chat",
  logs: "/logs",
  mapping: "/mapping",
  health: "/api/health",
  servers: "/servers",
  ibmHealth: "/api/ibm/health",
  ibmDataset: "/api/ibm/dataset",
  ibmServers: "/api/ibm/servers",
  ibmServerAccess: "/api/ibm/servers/access",
  ibmCubes: "/api/ibm/cubes",
  ibmCubeAccess: "/api/ibm/cubes/access",
  ibmDimensions: "/api/ibm/dimensions",
  ibmDimensionAccess: "/api/ibm/dimensions/access",
  ibmDimensionDetail: "/api/ibm/dimensions/detail",
  ibmDataPreview: "/api/ibm/data-preview",
  ibmComparator: "/api/ibm/comparator",
  ibmLogs: "/api/ibm/logs",
  ibmMapping: "/api/ibm/mapping",
} as const;

const getServerRoute = (serverName: string): string => {
  return `${appRoutes.servers}/${encodeURIComponent(serverName)}`;
};

const getCubeWorkspaceRoute = (
  cubeName: string,
  serverName: string,
): string => {
  return `${getServerRoute(serverName)}/cubes/${encodeURIComponent(cubeName)}`;
};

const getBusinessFlowRoute = (
  flowId: string,
  serverName?: string | undefined,
): string => {
  const baseRoute = `${appRoutes.flows}/${encodeURIComponent(flowId)}`;

  if (!serverName) {
    return baseRoute;
  }

  const search = new URLSearchParams({
    server: serverName,
  });

  return `${baseRoute}?${search.toString()}`;
};

const getServerLogsRoute = (serverName: string): string => {
  const search = new URLSearchParams({
    server: serverName,
  });

  return `${appRoutes.logs}?${search.toString()}`;
};

const getServerMappingRoute = (serverName: string): string => {
  const search = new URLSearchParams({
    server: serverName,
  });

  return `${appRoutes.mapping}?${search.toString()}`;
};

export {
  appRoutes,
  getBusinessFlowRoute,
  getCubeWorkspaceRoute,
  getServerLogsRoute,
  getServerMappingRoute,
  getServerRoute,
};
