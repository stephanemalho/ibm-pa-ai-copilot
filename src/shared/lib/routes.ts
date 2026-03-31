const appRoutes = {
  home: "/",
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
} as const;

const getServerRoute = (serverName: string): string => {
  return `${appRoutes.servers}/${encodeURIComponent(serverName)}`;
};

export { appRoutes, getServerRoute };
