type IbmPaMode = "live" | "mock";

type ServerAccessibilityClassification =
  | "accessible"
  | "authenticated_but_not_authorized"
  | "server_not_reachable_by_endpoint"
  | "unexpected_upstream_error";

type AccessResourceKind = "server" | "cube" | "dimension";

type ServerAccessibilityDiagnostic = {
  kind: AccessResourceKind;
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

type CubeAccessibilityDiagnostic = {
  kind: AccessResourceKind;
  classification: ServerAccessibilityClassification;
  message: string;
  name: string;
  reachable: boolean;
  serverName: string;
  statusCode?: number | undefined;
};

type CubeAccessibilityResponse = {
  cubes: CubeAccessibilityDiagnostic[];
  mode: IbmPaMode;
  serverName: string;
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

type CubeDataPreviewFilter = {
  dimensionName: string;
  hierarchyName?: string | undefined;
  memberName: string;
};

type CubeDataPreviewRow = {
  formattedValue?: string | null | undefined;
  memberName: string;
  uniqueName?: string | undefined;
  value: boolean | null | number | string;
};

type CubeDataPreviewRequest = {
  cubeName: string;
  filters: CubeDataPreviewFilter[];
  rowDimensionHierarchyName?: string | undefined;
  rowDimensionName: string;
  rowLimit?: number | undefined;
  serverName?: string | undefined;
};

type CubeDataPreviewResponse = {
  cubeName: string;
  filters: CubeDataPreviewFilter[];
  mode: IbmPaMode;
  rowDimensionName: string;
  rows: CubeDataPreviewRow[];
  serverName: string;
};

type DimensionAccessibilityDiagnostic = {
  kind: AccessResourceKind;
  classification: ServerAccessibilityClassification;
  cubeName: string;
  hierarchyName?: string | undefined;
  members: string[];
  message: string;
  name: string;
  reachable: boolean;
  serverName: string;
  statusCode?: number | undefined;
};

type DimensionAccessibilityResponse = {
  cubeName: string;
  dimensions: DimensionAccessibilityDiagnostic[];
  mode: IbmPaMode;
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
  AccessResourceKind,
  CubeAccessibilityDiagnostic,
  CubeAccessibilityResponse,
  CubeDimension,
  CubeDimensionsResponse,
  CubeDataPreviewFilter,
  CubeDataPreviewRequest,
  CubeDataPreviewResponse,
  CubeDataPreviewRow,
  CubeSampleMemberSet,
  CubeSummary,
  CubesResponse,
  DimensionAccessibilityDiagnostic,
  DimensionAccessibilityResponse,
  IbmPaMode,
  ServerAccessibilityClassification,
  ServerAccessibilityDiagnostic,
  ServerAccessibilityResponse,
};
