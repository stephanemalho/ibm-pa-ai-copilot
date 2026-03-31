type IbmPaMode = "live" | "mock";

type ServerAccessibilityClassification =
  | "accessible"
  | "authenticated_but_not_authorized"
  | "server_not_reachable_by_endpoint"
  | "unexpected_upstream_error";

type ServerAccessibilityDiagnostic = {
  classification: ServerAccessibilityClassification;
  message: string;
  name: string;
  reachable: boolean;
  statusCode?: number | undefined;
};

type ServerAccessibilityResponse = {
  mode: IbmPaMode;
  servers: ServerAccessibilityDiagnostic[];
};

type CubeSummary = {
  name: string;
  serverName: string;
};

type CubesResponse = {
  cubes: CubeSummary[];
  mode: IbmPaMode;
  serverName: string;
};

type CubeDimension = {
  cubeName: string;
  dimensionName: string;
  hierarchyName?: string | undefined;
  serverName: string;
};

type CubeSampleMemberSet = {
  cubeName: string;
  dimensionName: string;
  hierarchyName: string;
  members: string[];
  serverName: string;
};

type CubeDimensionsResponse = {
  cubeName: string;
  dimensions: CubeDimension[];
  members: CubeSampleMemberSet[];
  mode: IbmPaMode;
  serverName: string;
};

export type {
  CubeDimension,
  CubeDimensionsResponse,
  CubeSampleMemberSet,
  CubeSummary,
  CubesResponse,
  IbmPaMode,
  ServerAccessibilityClassification,
  ServerAccessibilityDiagnostic,
  ServerAccessibilityResponse,
};
