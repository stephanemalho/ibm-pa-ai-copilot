const appRoutes = {
  home: "/",
  chat: "/chat",
  health: "/api/health",
  servers: "/servers",
  ibmHealth: "/api/ibm/health",
  ibmServers: "/api/ibm/servers",
  ibmServerAccess: "/api/ibm/servers/access",
  ibmCubes: "/api/ibm/cubes",
  ibmDimensions: "/api/ibm/dimensions",
} as const;

const getServerRoute = (serverName: string): string => {
  return `${appRoutes.servers}/${encodeURIComponent(serverName)}`;
};

export { appRoutes, getServerRoute };
