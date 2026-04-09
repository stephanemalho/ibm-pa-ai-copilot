import "server-only";

import type {
  AccessResourceKind,
  CubeAccessibilityResponse,
  CubeAccessibilityDiagnostic,
  CubeComparatorFilter,
  CubeComparatorResponse as SharedCubeComparatorResponse,
  CubeComparatorRow,
  CubeDataPreviewFilter,
  CubeDataPreviewResponse as SharedCubeDataPreviewResponse,
  CubeDataPreviewRow,
  CubeDimension,
  CubeDimensionStructureDiagnostic,
  CubeSemanticMetadata,
  CubeSampleMemberSet,
  CubeSummary,
  DimensionAccessibilityDiagnostic,
  DimensionSemanticMetadata,
  IbmPaMode,
  ServerAccessibilityClassification as Tm1ServerAccessibilityClassification,
  ServerAccessibilityDiagnostic as Tm1ServerAccessibilityDiagnostic,
  Tm1AttributeMap,
  Tm1HierarchyMetadata,
  Tm1LocalizedAttributeMap,
  Tm1Member,
} from "@/shared/types/ibm-pa";

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

type Tm1ServerAccessibilityDiagnosticsResult = {
  mode: IbmPaMode;
  servers: Tm1ServerAccessibilityDiagnostic[];
};

type CubeAccessibilityDiagnosticsResult = {
  cubes: CubeAccessibilityDiagnostic[];
  mode: IbmPaMode;
  serverName: string;
};

type DimensionAccessibilityDiagnosticsResult = {
  cubeName: string;
  dimensions: DimensionAccessibilityDiagnostic[];
  mode: IbmPaMode;
  serverName: string;
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

type CubeDataPreviewResult = SharedCubeDataPreviewResponse;

type CubeComparatorResult = SharedCubeComparatorResponse;

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

type GetCubeComparatorParams = {
  baseMemberName: string;
  compareMemberName: string;
  comparisonDimensionHierarchyName?: string;
  comparisonDimensionName: string;
  contextFilters: CubeComparatorFilter[];
  cubeName: string;
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

type Tm1MetadataEnvelope = {
  attributes: CubeSemanticMetadata["attributes"];
  caption?: string | undefined;
  localizedAttributes: CubeSemanticMetadata["localizedAttributes"];
};

type Tm1DimensionMetadata = DimensionSemanticMetadata;

type Tm1CubeMetadata = CubeSemanticMetadata;

type Tm1HierarchySummary = Tm1HierarchyMetadata;

export type {
  AccessResourceKind,
  CubeAccessibilityResponse,
  CubeAccessibilityDiagnostic,
  CubeAccessibilityDiagnosticsResult,
  CubeComparatorFilter,
  CubeComparatorResult,
  CubeComparatorRow,
  CubeDataPreviewFilter,
  CubeDataPreviewResult,
  CubeDataPreviewRow,
  CubeDimension,
  CubeDimensionsResult,
  CubeDimensionStructureDiagnostic,
  CubeDimensionStructureResult,
  CubeSampleMemberSet,
  CubeSampleMembersResult,
  CubeSummary,
  DimensionAccessibilityDiagnostic,
  DimensionAccessibilityDiagnosticsResult,
  DimensionSemanticMetadata,
  GetCubeDataPreviewParams,
  GetCubeComparatorParams,
  GetCubeDimensionsParams,
  GetCubeSampleMembersParams,
  GetDimensionAccessibilityDiagnosticParams,
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
  Tm1CubeMetadata,
  Tm1DimensionMetadata,
  Tm1AttributeMap,
  Tm1HierarchyMetadata,
  Tm1HierarchySummary,
  Tm1LocalizedAttributeMap,
  Tm1MetadataEnvelope,
  Tm1Member,
  Tm1ServerAccessibilityClassification,
  Tm1ServerAccessibilityDiagnostic,
  Tm1ServerAccessibilityDiagnosticsResult,
  Tm1ServerSummary,
};
