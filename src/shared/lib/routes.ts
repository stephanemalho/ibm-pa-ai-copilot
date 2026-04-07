const appRoutes = {
  home: "/",
  flows: "/flows",
  chat: "/chat",
  health: "/api/health",
  servers: "/servers",
  ibmHealth: "/api/ibm/health",
  ibmServers: "/api/ibm/servers",
  ibmServerAccess: "/api/ibm/servers/access",
  ibmCubes: "/api/ibm/cubes",
  ibmCubeAccess: "/api/ibm/cubes/access",
  ibmDimensions: "/api/ibm/dimensions",
  ibmDimensionAccess: "/api/ibm/dimensions/access",
  ibmDimensionDetail: "/api/ibm/dimensions/detail",
  ibmDataPreview: "/api/ibm/data-preview",
  ibmComparator: "/api/ibm/comparator",
} as const;

const getServerRoute = (serverName: string): string => {
  return `${appRoutes.servers}/${encodeURIComponent(serverName)}`;
};

const getCubeWorkspaceRoute = (cubeName: string, serverName: string): string => {
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

export { appRoutes, getBusinessFlowRoute, getCubeWorkspaceRoute, getServerRoute };
