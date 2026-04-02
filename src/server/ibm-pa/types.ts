import "server-only";

type IbmPaMode = "live" | "mock";

type IbmPaLogContextValue = boolean | null | number | string | undefined;

type IbmPaLogContext = Record<string, IbmPaLogContextValue>;

type IbmPaSession = {
  authenticatedAt: string;
  cookieHeader: string;
};

type IbmPaRuntimeConfig = {
  baseUrl?: string;
  isConfigured: boolean;
  mode: IbmPaMode;
  targetTm1Server?: string;
  tenantId?: string;
};

type Tm1ServerSummary = {
  description?: string;
  displayName: string;
  id: string;
  isDefault: boolean;
  name: string;
};

type CubeSummary = {
  name: string;
  serverName: string;
};

type CubeDimension = {
  cubeName: string;
  dimensionName: string;
  hierarchyName?: string;
  serverName: string;
};

type CubeSampleMemberSet = {
  cubeName: string;
  dimensionName: string;
  hierarchyName: string;
  members: string[];
  serverName: string;
};

type MdxCellValue = boolean | null | number | string;

type MdxAxisMember = {
  elementName?: string;
  name?: string;
  uniqueName?: string;
};

type MdxTuple = {
  members: MdxAxisMember[];
  ordinal: number;
};

type MdxAxis = {
  ordinal: number;
  tuples: MdxTuple[];
};

type MdxCell = {
  formattedValue?: string | null;
  ordinal: number;
  value: MdxCellValue;
};

type MdxQueryResult = {
  axes: MdxAxis[];
  cells: MdxCell[];
  cubeName?: string;
  mdx: string;
  serverName: string;
};

type IbmPaHealthStatus = {
  authenticated: boolean;
  availableServerCount: number;
  configured: boolean;
  mode: IbmPaMode;
  status: "ok";
  targetTm1Server?: string;
};

type ListTm1ServersResult = {
  mode: IbmPaMode;
  servers: Tm1ServerSummary[];
};

type Tm1ServerAccessibilityClassification =
  | "accessible"
  | "authenticated_but_not_authorized"
  | "server_not_reachable_by_endpoint"
  | "unexpected_upstream_error";

type AccessResourceKind = "server" | "cube" | "dimension";

type Tm1ServerAccessibilityDiagnostic = {
  kind: AccessResourceKind;
  classification: Tm1ServerAccessibilityClassification;
  message: string;
  name: string;
  reachable: boolean;
  statusCode?: number;
};

type Tm1ServerAccessibilityDiagnosticsResult = {
  mode: IbmPaMode;
  servers: Tm1ServerAccessibilityDiagnostic[];
};

type CubeAccessibilityDiagnostic = {
  kind: AccessResourceKind;
  classification: Tm1ServerAccessibilityClassification;
  message: string;
  name: string;
  reachable: boolean;
  serverName: string;
  statusCode?: number;
};

type CubeAccessibilityDiagnosticsResult = {
  cubes: CubeAccessibilityDiagnostic[];
  mode: IbmPaMode;
  serverName: string;
};

type DimensionAccessibilityDiagnostic = {
  kind: AccessResourceKind;
  classification: Tm1ServerAccessibilityClassification;
  cubeName: string;
  hierarchyName?: string;
  members: string[];
  message: string;
  name: string;
  reachable: boolean;
  serverName: string;
  statusCode?: number;
};

type DimensionAccessibilityDiagnosticsResult = {
  cubeName: string;
  dimensions: DimensionAccessibilityDiagnostic[];
  mode: IbmPaMode;
  serverName: string;
};

type CubeDimensionStructureDiagnostic = {
  classification: Tm1ServerAccessibilityClassification;
  cubeName: string;
  hierarchyName?: string;
  kind: AccessResourceKind;
  message: string;
  name: string;
  reachable: boolean;
  serverName: string;
  statusCode?: number;
};

type CubeDimensionStructureResult = {
  cubeName: string;
  dimensions: CubeDimensionStructureDiagnostic[];
  mode: IbmPaMode;
  serverName: string;
};

type GetDimensionAccessibilityDiagnosticParams = {
  cubeName: string;
  dimensionName: string;
  sampleSize?: number;
  serverName: string;
};

type ListCubesResult = {
  cubes: CubeSummary[];
  mode: IbmPaMode;
  serverName: string;
};

type CubeDimensionsResult = {
  dimensions: CubeDimension[];
  mode: IbmPaMode;
  serverName: string;
};

type CubeSampleMembersResult = {
  members: CubeSampleMemberSet[];
  mode: IbmPaMode;
  serverName: string;
};

type CubeDataPreviewFilter = {
  dimensionName: string;
  hierarchyName?: string;
  memberName: string;
};

type CubeDataPreviewRow = {
  formattedValue?: string | null;
  memberName: string;
  uniqueName?: string;
  value: MdxCellValue;
};

type CubeDataPreviewResult = {
  cubeName: string;
  filters: CubeDataPreviewFilter[];
  mode: IbmPaMode;
  rowDimensionName: string;
  rows: CubeDataPreviewRow[];
  serverName: string;
};

type RunMdxParams = {
  cubeName?: string;
  mdx: string;
  serverName?: string;
};

type GetCubeDimensionsParams = {
  cubeName: string;
  serverName?: string;
};

type GetCubeSampleMembersParams = GetCubeDimensionsParams & {
  sampleSize?: number;
};

type GetCubeDataPreviewParams = {
  cubeName: string;
  filters: CubeDataPreviewFilter[];
  rowDimensionHierarchyName?: string;
  rowDimensionName: string;
  rowLimit?: number;
  serverName?: string;
};

type ListCubesParams = {
  serverName?: string;
};

type IbmPaRequestScope =
  | {
      kind: "tenant";
    }
  | {
      kind: "tm1";
      serverName: string;
    };

type IbmPaRequestOptions = {
  body?: unknown;
  method?: "GET" | "POST";
  path: string;
  scope: IbmPaRequestScope;
};

export type {
  AccessResourceKind,
  CubeAccessibilityDiagnostic,
  CubeAccessibilityDiagnosticsResult,
  CubeDimension,
  CubeDimensionsResult,
  CubeDataPreviewFilter,
  CubeDataPreviewResult,
  CubeDataPreviewRow,
  CubeDimensionStructureDiagnostic,
  CubeDimensionStructureResult,
  CubeSampleMemberSet,
  CubeSampleMembersResult,
  CubeSummary,
  DimensionAccessibilityDiagnostic,
  DimensionAccessibilityDiagnosticsResult,
  GetDimensionAccessibilityDiagnosticParams,
  GetCubeDataPreviewParams,
  GetCubeDimensionsParams,
  GetCubeSampleMembersParams,
  IbmPaHealthStatus,
  IbmPaLogContext,
  IbmPaLogContextValue,
  IbmPaMode,
  IbmPaRequestOptions,
  IbmPaRequestScope,
  IbmPaRuntimeConfig,
  IbmPaSession,
  ListCubesParams,
  ListCubesResult,
  ListTm1ServersResult,
  MdxAxis,
  MdxAxisMember,
  MdxCell,
  MdxCellValue,
  MdxQueryResult,
  MdxTuple,
  RunMdxParams,
  Tm1ServerAccessibilityClassification,
  Tm1ServerAccessibilityDiagnostic,
  Tm1ServerAccessibilityDiagnosticsResult,
  Tm1ServerSummary,
};
